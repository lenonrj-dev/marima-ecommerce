import { CommentStatus, Prisma } from "@prisma/client";
import { delByPrefix, getOrSetCache, hashCacheQuery } from "../../../lib/cache";
import { getRedisClient } from "../../../lib/redis";
import { ApiError } from "../../../utils/apiError";
import {
  createComment,
  findBlogPostBySlug,
  findCommentById,
  listTopLevelCommentsByPostId,
  patchCommentStatusById,
  type BlogCommentWithRelations,
} from "./comments.repository";

type ViewerAuth =
  | {
      sub: string;
      type: "admin" | "customer";
    }
  | undefined;

type ListCommentsInput = {
  slug: string;
  limit: number;
  cursor?: string;
  viewer?: ViewerAuth;
};

type CreateCommentInput = {
  slug: string;
  customerId: string;
  content: string;
  parentId?: string;
  ip?: string;
};

const COMMENTS_CACHE_TTL_SECONDS = 60;
const COMMENT_RATE_LIMIT_PER_MINUTE = 5;
const COMMENT_RATE_WINDOW_SECONDS = 60;
const COMMENT_RATE_PREFIX = "rate:v1:blog:comment:create";
const memoryRateLimiter = new Map<string, { count: number; expiresAt: number }>();

function toAuthorName(name: string | null | undefined) {
  const parsed = String(name || "").trim();
  return parsed || "Cliente";
}

function buildCommentDto(comment: BlogCommentWithRelations, viewer?: ViewerAuth) {
  const viewerId = viewer?.sub;
  const includeStatus = viewer?.type === "admin";

  return {
    id: String(comment.id),
    content: String(comment.content || ""),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    status: includeStatus ? comment.status : undefined,
    isOwner: Boolean(viewerId && String(comment.customerId) === viewerId),
    author: {
      id: String(comment.customer?.id || ""),
      name: toAuthorName(comment.customer?.name),
    },
    replies: (comment.replies || []).map((reply) => ({
      id: String(reply.id),
      content: String(reply.content || ""),
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      status: includeStatus ? reply.status : undefined,
      isOwner: Boolean(viewerId && String(reply.customerId) === viewerId),
      author: {
        id: String(reply.customer?.id || ""),
        name: toAuthorName(reply.customer?.name),
      },
    })),
  };
}

function buildCommentCachePrefix(postId: string) {
  return `cache:v1:blog:comments:${postId}`;
}

async function invalidateCommentCaches(postId: string) {
  await delByPrefix(buildCommentCachePrefix(postId));
}

function normalizeIp(ip: string | undefined) {
  const parsed = String(ip || "").trim();
  if (!parsed) return "unknown";
  return parsed.slice(0, 128);
}

async function enforceCreateRateLimit(customerId: string, ip?: string) {
  const key = `${COMMENT_RATE_PREFIX}:${customerId}:${normalizeIp(ip)}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, COMMENT_RATE_WINDOW_SECONDS);
      }

      if (count > COMMENT_RATE_LIMIT_PER_MINUTE) {
        throw new ApiError(429, "Muitas tentativas. Aguarde alguns segundos para comentar novamente.");
      }
      return;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // Fallback em memória quando Redis indisponível.
    }
  }

  const now = Date.now();
  const current = memoryRateLimiter.get(key);
  if (!current || current.expiresAt <= now) {
    memoryRateLimiter.set(key, {
      count: 1,
      expiresAt: now + COMMENT_RATE_WINDOW_SECONDS * 1000,
    });
    return;
  }

  if (current.count >= COMMENT_RATE_LIMIT_PER_MINUTE) {
    throw new ApiError(429, "Muitas tentativas. Aguarde alguns segundos para comentar novamente.");
  }

  memoryRateLimiter.set(key, {
    count: current.count + 1,
    expiresAt: current.expiresAt,
  });
}

async function resolvePostForComments(slug: string, viewer?: ViewerAuth) {
  const post = await findBlogPostBySlug(slug);
  if (!post) {
    throw new ApiError(404, "Post não encontrado.");
  }

  if (!post.published && viewer?.type !== "admin") {
    throw new ApiError(404, "Post não encontrado.");
  }

  return post;
}

async function loadCommentsFromDatabase(input: ListCommentsInput) {
  const post = await resolvePostForComments(input.slug, input.viewer);
  const status: CommentStatus | undefined = input.viewer?.type === "admin" ? undefined : "published";

  let rows: BlogCommentWithRelations[];
  try {
    rows = await listTopLevelCommentsByPostId({
      postId: post.id,
      status,
      limit: input.limit,
      cursor: input.cursor,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new ApiError(400, "Cursor inválido.");
    }
    throw error;
  }

  const hasMore = rows.length > input.limit;
  const sliced = hasMore ? rows.slice(0, input.limit) : rows;
  const nextCursor = hasMore ? String(sliced[sliced.length - 1]?.id || "") : null;

  return {
    items: sliced.map((row) => buildCommentDto(row, input.viewer)),
    nextCursor,
    hasMore,
  };
}

export async function listPostComments(input: ListCommentsInput) {
  const shouldUsePublicCache = !input.viewer;
  if (!shouldUsePublicCache) {
    return loadCommentsFromDatabase(input);
  }

  const post = await resolvePostForComments(input.slug, undefined);
  const cacheKey = `${buildCommentCachePrefix(post.id)}:${hashCacheQuery({
    limit: input.limit,
    cursor: input.cursor || "",
    visibility: "published",
  })}`;

  return getOrSetCache(cacheKey, COMMENTS_CACHE_TTL_SECONDS, () =>
    loadCommentsFromDatabase({
      ...input,
      viewer: undefined,
    }),
  );
}

export async function createPostComment(input: CreateCommentInput) {
  const post = await resolvePostForComments(input.slug, {
    sub: input.customerId,
    type: "customer",
  });

  await enforceCreateRateLimit(input.customerId, input.ip);

  const content = String(input.content || "").trim();
  if (content.length < 3 || content.length > 1000) {
    throw new ApiError(400, "Comentário deve ter entre 3 e 1000 caracteres.");
  }

  let parentId: string | undefined;
  if (input.parentId) {
    const parent = await findCommentById(String(input.parentId));
    if (!parent || String(parent.postId) !== post.id) {
      throw new ApiError(404, "Comentário pai não encontrado.");
    }
    if (parent.parentId) {
      throw new ApiError(400, "Respostas em múltiplos níveis não são permitidas.");
    }
    parentId = String(parent.id);
  }

  const created = await createComment({
    postId: post.id,
    customerId: input.customerId,
    content,
    parentId,
  });

  await invalidateCommentCaches(post.id);

  return buildCommentDto(created, {
    sub: input.customerId,
    type: "customer",
  });
}

export async function patchCommentStatus(input: { id: string; status: CommentStatus }) {
  const existing = await findCommentById(input.id);
  if (!existing) {
    throw new ApiError(404, "Comentário não encontrado.");
  }

  const updated = await patchCommentStatusById(input.id, input.status);
  await invalidateCommentCaches(String(existing.postId));
  return buildCommentDto(updated, { sub: "", type: "admin" });
}
