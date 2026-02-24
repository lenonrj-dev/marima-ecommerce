"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPostComments = listPostComments;
exports.createPostComment = createPostComment;
exports.patchCommentStatus = patchCommentStatus;
const client_1 = require("@prisma/client");
const cache_1 = require("../../../lib/cache");
const redis_1 = require("../../../lib/redis");
const apiError_1 = require("../../../utils/apiError");
const comments_repository_1 = require("./comments.repository");
const COMMENTS_CACHE_TTL_SECONDS = 60;
const COMMENT_RATE_LIMIT_PER_MINUTE = 5;
const COMMENT_RATE_WINDOW_SECONDS = 60;
const COMMENT_RATE_PREFIX = "rate:v1:blog:comment:create";
const memoryRateLimiter = new Map();
function toAuthorName(name) {
    const parsed = String(name || "").trim();
    return parsed || "Cliente";
}
function buildCommentDto(comment, viewer) {
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
function buildCommentCachePrefix(postId) {
    return `cache:v1:blog:comments:${postId}`;
}
async function invalidateCommentCaches(postId) {
    await (0, cache_1.delByPrefix)(buildCommentCachePrefix(postId));
}
function normalizeIp(ip) {
    const parsed = String(ip || "").trim();
    if (!parsed)
        return "unknown";
    return parsed.slice(0, 128);
}
async function enforceCreateRateLimit(customerId, ip) {
    const key = `${COMMENT_RATE_PREFIX}:${customerId}:${normalizeIp(ip)}`;
    const redis = (0, redis_1.getRedisClient)();
    if (redis) {
        try {
            const count = await redis.incr(key);
            if (count === 1) {
                await redis.expire(key, COMMENT_RATE_WINDOW_SECONDS);
            }
            if (count > COMMENT_RATE_LIMIT_PER_MINUTE) {
                throw new apiError_1.ApiError(429, "Muitas tentativas. Aguarde alguns segundos para comentar novamente.");
            }
            return;
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError)
                throw error;
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
        throw new apiError_1.ApiError(429, "Muitas tentativas. Aguarde alguns segundos para comentar novamente.");
    }
    memoryRateLimiter.set(key, {
        count: current.count + 1,
        expiresAt: current.expiresAt,
    });
}
async function resolvePostForComments(slug, viewer) {
    const post = await (0, comments_repository_1.findBlogPostBySlug)(slug);
    if (!post) {
        throw new apiError_1.ApiError(404, "Post não encontrado.");
    }
    if (!post.published && viewer?.type !== "admin") {
        throw new apiError_1.ApiError(404, "Post não encontrado.");
    }
    return post;
}
async function loadCommentsFromDatabase(input) {
    const post = await resolvePostForComments(input.slug, input.viewer);
    const status = input.viewer?.type === "admin" ? undefined : "published";
    let rows;
    try {
        rows = await (0, comments_repository_1.listTopLevelCommentsByPostId)({
            postId: post.id,
            status,
            limit: input.limit,
            cursor: input.cursor,
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new apiError_1.ApiError(400, "Cursor inválido.");
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
async function listPostComments(input) {
    const shouldUsePublicCache = !input.viewer;
    if (!shouldUsePublicCache) {
        return loadCommentsFromDatabase(input);
    }
    const post = await resolvePostForComments(input.slug, undefined);
    const cacheKey = `${buildCommentCachePrefix(post.id)}:${(0, cache_1.hashCacheQuery)({
        limit: input.limit,
        cursor: input.cursor || "",
        visibility: "published",
    })}`;
    return (0, cache_1.getOrSetCache)(cacheKey, COMMENTS_CACHE_TTL_SECONDS, () => loadCommentsFromDatabase({
        ...input,
        viewer: undefined,
    }));
}
async function createPostComment(input) {
    const post = await resolvePostForComments(input.slug, {
        sub: input.customerId,
        type: "customer",
    });
    await enforceCreateRateLimit(input.customerId, input.ip);
    const content = String(input.content || "").trim();
    if (content.length < 3 || content.length > 1000) {
        throw new apiError_1.ApiError(400, "Comentário deve ter entre 3 e 1000 caracteres.");
    }
    let parentId;
    if (input.parentId) {
        const parent = await (0, comments_repository_1.findCommentById)(String(input.parentId));
        if (!parent || String(parent.postId) !== post.id) {
            throw new apiError_1.ApiError(404, "Comentário pai não encontrado.");
        }
        if (parent.parentId) {
            throw new apiError_1.ApiError(400, "Respostas em múltiplos níveis não são permitidas.");
        }
        parentId = String(parent.id);
    }
    const created = await (0, comments_repository_1.createComment)({
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
async function patchCommentStatus(input) {
    const existing = await (0, comments_repository_1.findCommentById)(input.id);
    if (!existing) {
        throw new apiError_1.ApiError(404, "Comentário não encontrado.");
    }
    const updated = await (0, comments_repository_1.patchCommentStatusById)(input.id, input.status);
    await invalidateCommentCaches(String(existing.postId));
    return buildCommentDto(updated, { sub: "", type: "admin" });
}
