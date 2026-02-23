import { Prisma } from "@prisma/client";
import { getOrSetCache, hashCacheQuery, getCacheVersion, bumpCacheVersion, delCache } from "../lib/cache";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { slugify } from "../utils/slug";

export type BlogStatus = "published" | "draft" | "all";

export type PostDTO = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  topic: string;
  topic2?: string;
  featured: boolean;
  readingMinutes: number;
  published: boolean;
  publishedAt?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogCategoryCount = {
  category: string;
  slug: string;
  count: number;
};

type PostListInput = {
  page: number;
  limit: number;
  q?: string;
  status: BlogStatus;
  topic?: string;
  tags?: string[];
  sort?: "relevance" | "newest";
};

type CreatePostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  topic?: string;
  topic2?: string;
  featured?: boolean;
  readingMinutes?: number;
  published?: boolean;
  publishedAt?: string;
  authorName?: string;
};

type UpdatePostInput = Partial<CreatePostInput>;

const BLOG_LIST_VERSION_KEY = "cache:v1:blog:listVersion";
const BLOG_LIST_TTL_SECONDS = 60 * 60 * 6;
const BLOG_POST_TTL_SECONDS = 60 * 60 * 24;
const BLOG_CATEGORY_COUNTS_TTL_SECONDS = 60 * 10;

const BLOG_TOPIC_DEFINITIONS = [
  { id: "treino", label: "Treino" },
  { id: "moda-fitness", label: "Moda fitness" },
  { id: "tecnologia-textil", label: "Tecnologia textil" },
  { id: "bem-estar", label: "Bem-estar" },
  { id: "estilo-casual", label: "Estilo casual" },
  { id: "novidades", label: "Novidades" },
  { id: "guias", label: "Guias" },
  { id: "marima", label: "Marima" },
] as const;

const BLOG_TOPIC_ALIASES = new Map<string, string>();
for (const topic of BLOG_TOPIC_DEFINITIONS) {
  BLOG_TOPIC_ALIASES.set(topic.id, topic.id);
  BLOG_TOPIC_ALIASES.set(slugify(topic.label), topic.id);
}
BLOG_TOPIC_ALIASES.set("moda", "moda-fitness");
BLOG_TOPIC_ALIASES.set("tecnologia", "tecnologia-textil");
BLOG_TOPIC_ALIASES.set("tecnologia-textil", "tecnologia-textil");
BLOG_TOPIC_ALIASES.set("bem-estar", "bem-estar");
BLOG_TOPIC_ALIASES.set("estilo", "estilo-casual");
BLOG_TOPIC_ALIASES.set("casual", "estilo-casual");

function resolveBlogTopicId(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "novidades";
  const normalized = slugify(raw);
  if (!normalized) return "novidades";
  return BLOG_TOPIC_ALIASES.get(normalized) || "novidades";
}

function resolveBlogTopicFilter(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return undefined;
  const normalized = slugify(raw);
  if (!normalized) return undefined;
  return BLOG_TOPIC_ALIASES.get(normalized);
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;
    const tag = item.trim();
    if (!tag) continue;

    const key = tag.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

function normalizeTagFilters(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;
    const tag = item.trim();
    if (!tag) continue;

    const key = tag.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

function normalizeSlug(value: string | undefined, fallbackTitle: string) {
  const source = (value || "").trim() || fallbackTitle;
  const parsed = slugify(source);
  if (!parsed) throw new ApiError(400, "Slug invalido.");
  return parsed;
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();

  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function estimateReadingMinutes(content: string) {
  const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function toPostDTO(post: any): PostDTO {
  return {
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    content: post.content || "",
    coverImage: post.coverImage || "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    topic: post.topic || "novidades",
    topic2: post.topic2 || undefined,
    featured: Boolean(post.featured),
    readingMinutes: Math.max(1, Number(post.readingMinutes || 5)),
    published: Boolean(post.published),
    publishedAt: toIso(post.publishedAt),
    authorName: post.authorName || undefined,
    createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: post.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

async function ensureUniqueSlug(slug: string, ignoreId?: string) {
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (!existing) return;
  if (ignoreId && String(existing.id) === ignoreId) return;
  throw new ApiError(409, "Slug ja existente.");
}

function buildStatusQuery(status: BlogStatus) {
  if (status === "published") return { published: true };
  if (status === "draft") return { published: false };
  return {};
}

async function invalidateBlogCaches(slugs: string[]) {
  await bumpCacheVersion(BLOG_LIST_VERSION_KEY);

  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
  await Promise.all(uniqueSlugs.map((slug) => delCache(`cache:v1:blog:post:${slug}`)));
}

export async function listBlogPosts(input: PostListInput) {
  const normalizedTopic = resolveBlogTopicFilter(input.topic);
  const normalizedTags = normalizeTagFilters(input.tags);
  const normalizedSort = input.sort === "newest" ? "newest" : "relevance";
  const version = await getCacheVersion(BLOG_LIST_VERSION_KEY, 1);
  const listHash = hashCacheQuery({
    page: input.page,
    limit: input.limit,
    q: input.q || "",
    status: input.status,
    topic: normalizedTopic || "",
    tags: normalizedTags,
    sort: normalizedSort,
  });

  const cacheKey = `cache:v1:blog:list:v${version}:${listHash}`;

  return getOrSetCache(cacheKey, BLOG_LIST_TTL_SECONDS, async () => {
    const offset = (input.page - 1) * input.limit;
    const useRawSearch = Boolean(input.q) || normalizedTags.length > 0;

    if (!useRawSearch) {
      const where: Prisma.PostWhereInput = {
        ...buildStatusQuery(input.status),
      };

      if (normalizedTopic) {
        where.topic = normalizedTopic;
      }

      const [rows, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
          skip: offset,
          take: input.limit,
        }),
        prisma.post.count({ where }),
      ]);

      return {
        data: rows.map((post) => toPostDTO(post)),
        meta: buildMeta(total, input.page, input.limit),
      };
    }

    const conditions: Prisma.Sql[] = [];

    if (input.status === "published") {
      conditions.push(Prisma.sql`p."published" = TRUE`);
    } else if (input.status === "draft") {
      conditions.push(Prisma.sql`p."published" = FALSE`);
    }

    if (normalizedTopic) {
      conditions.push(Prisma.sql`p."topic" = ${normalizedTopic}`);
    }

    if (normalizedTags.length > 0) {
      const tagMatches = normalizedTags.map(
        (tag) => Prisma.sql`
          EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(p."tags", '[]'::jsonb)) AS jt(value)
            WHERE lower(jt.value) = lower(${tag})
          )
        `,
      );
      conditions.push(Prisma.sql`(${Prisma.join(tagMatches, " OR ")})`);
    }

    if (input.q) {
      conditions.push(
        Prisma.sql`to_tsvector('portuguese', coalesce(p."title", '') || ' ' || coalesce(p."excerpt", '') || ' ' || coalesce(p."content", '')) @@ websearch_to_tsquery('portuguese', ${input.q})`,
      );
    }

    const whereSql = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

    const newestOrderSql = Prisma.sql`ORDER BY p."publishedAt" DESC NULLS LAST, p."updatedAt" DESC, p."createdAt" DESC`;
    const relevanceOrderSql =
      input.q && normalizedSort !== "newest"
        ? Prisma.sql`
            ORDER BY
              ts_rank(
                to_tsvector('portuguese', coalesce(p."title", '') || ' ' || coalesce(p."excerpt", '') || ' ' || coalesce(p."content", '')),
                websearch_to_tsquery('portuguese', ${input.q})
              ) DESC,
              p."publishedAt" DESC NULLS LAST,
              p."updatedAt" DESC,
              p."createdAt" DESC
          `
        : newestOrderSql;

    const [rows, totalRows] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT p.*
        FROM "Post" AS p
        ${whereSql}
        ${relevanceOrderSql}
        LIMIT ${input.limit}
        OFFSET ${offset}
      `),
      prisma.$queryRaw<Array<{ total: bigint | number | string }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "Post" AS p
        ${whereSql}
      `),
    ]);

    const rawTotal = totalRows[0]?.total ?? 0;
    const total = Number(rawTotal);

    return {
      data: rows.map((post) => toPostDTO(post)),
      meta: buildMeta(Number.isFinite(total) ? total : 0, input.page, input.limit),
    };
  });
}

export async function listBlogCategoryCounts() {
  const version = await getCacheVersion(BLOG_LIST_VERSION_KEY, 1);
  const cacheKey = `cache:v1:blog:categories:v${version}`;

  return getOrSetCache(cacheKey, BLOG_CATEGORY_COUNTS_TTL_SECONDS, async () => {
    const grouped = await prisma.post.groupBy({
      by: ["topic"],
      where: { published: true },
      _count: { _all: true },
    });

    const totals = new Map<string, number>();
    for (const topic of BLOG_TOPIC_DEFINITIONS) {
      totals.set(topic.id, 0);
    }

    for (const row of grouped) {
      const topicId = resolveBlogTopicId(row.topic);
      const current = totals.get(topicId) || 0;
      totals.set(topicId, current + Math.max(0, Number(row._count._all || 0)));
    }

    const counts: BlogCategoryCount[] = BLOG_TOPIC_DEFINITIONS.map((topic) => ({
      category: topic.label,
      slug: topic.id,
      count: totals.get(topic.id) || 0,
    }));

    return {
      counts,
      total: counts.reduce((acc, item) => acc + item.count, 0),
    };
  });
}

export async function getBlogPostBySlug(slug: string, options?: { includeDraft?: boolean }) {
  const parsedSlug = normalizeSlug(slug, slug);

  if (options?.includeDraft) {
    const post = await prisma.post.findUnique({ where: { slug: parsedSlug } });
    if (!post) throw new ApiError(404, "Post nao encontrado.");
    return toPostDTO(post);
  }

  return getOrSetCache(`cache:v1:blog:post:${parsedSlug}`, BLOG_POST_TTL_SECONDS, async () => {
    const post = await prisma.post.findFirst({ where: { slug: parsedSlug, published: true } });
    if (!post) throw new ApiError(404, "Post nao encontrado.");
    return toPostDTO(post);
  });
}

export async function getBlogPostById(id: string) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError(404, "Post nao encontrado.");
  return toPostDTO(post);
}

export async function createBlogPost(input: CreatePostInput) {
  const title = normalizeOptionalString(input.title);
  const content = normalizeOptionalString(input.content);

  if (!title) throw new ApiError(400, "Titulo e obrigatorio.");
  if (!content) throw new ApiError(400, "Conteudo e obrigatorio.");

  const slug = normalizeSlug(input.slug, title);
  await ensureUniqueSlug(slug);

  const published = Boolean(input.published);
  const publishedAt = published
    ? input.publishedAt
      ? new Date(input.publishedAt)
      : new Date()
    : undefined;

  const created = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt: normalizeOptionalString(input.excerpt) || "",
      content,
      coverImage: normalizeOptionalString(input.coverImage) || "",
      tags: normalizeTags(input.tags),
      topic: resolveBlogTopicId(input.topic),
      topic2: normalizeOptionalString(input.topic2),
      featured: Boolean(input.featured),
      readingMinutes:
        typeof input.readingMinutes === "number" && Number.isFinite(input.readingMinutes)
          ? Math.max(1, Math.floor(input.readingMinutes))
          : estimateReadingMinutes(content),
      published,
      publishedAt,
      authorName: normalizeOptionalString(input.authorName) || "",
    },
  });

  await invalidateBlogCaches([created.slug]);
  return toPostDTO(created);
}

export async function updateBlogPost(id: string, input: UpdatePostInput) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) throw new ApiError(404, "Post nao encontrado.");

  const previousSlug = String(post.slug || "");
  const nextData: any = {};

  let nextTitle = post.title;
  if (input.title !== undefined) {
    const title = normalizeOptionalString(input.title);
    if (!title) throw new ApiError(400, "Titulo e obrigatorio.");
    nextTitle = title;
    nextData.title = title;
  }

  if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug, nextTitle);
    await ensureUniqueSlug(slug, post.id);
    nextData.slug = slug;
  }

  if (input.excerpt !== undefined) nextData.excerpt = normalizeOptionalString(input.excerpt) || "";
  if (input.content !== undefined) {
    const content = normalizeOptionalString(input.content);
    if (!content) throw new ApiError(400, "Conteudo e obrigatorio.");
    nextData.content = content;
    if (input.readingMinutes === undefined) {
      nextData.readingMinutes = estimateReadingMinutes(content);
    }
  }
  if (input.coverImage !== undefined) nextData.coverImage = normalizeOptionalString(input.coverImage) || "";
  if (input.tags !== undefined) nextData.tags = normalizeTags(input.tags);
  if (input.topic !== undefined) nextData.topic = resolveBlogTopicId(input.topic);
  if (input.topic2 !== undefined) nextData.topic2 = normalizeOptionalString(input.topic2) || null;
  if (input.featured !== undefined) nextData.featured = Boolean(input.featured);
  if (input.authorName !== undefined) nextData.authorName = normalizeOptionalString(input.authorName) || "";

  if (input.readingMinutes !== undefined) {
    if (!Number.isFinite(input.readingMinutes)) {
      throw new ApiError(400, "Tempo de leitura invalido.");
    }
    nextData.readingMinutes = Math.max(1, Math.floor(input.readingMinutes));
  }

  if (input.published !== undefined) {
    const nextPublished = Boolean(input.published);
    nextData.published = nextPublished;
    if (nextPublished) {
      nextData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : post.publishedAt || new Date();
    } else {
      nextData.publishedAt = null;
    }
  } else if (input.publishedAt !== undefined) {
    nextData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  }

  const updated = await prisma.post.update({
    where: { id },
    data: nextData,
  });

  await invalidateBlogCaches([previousSlug, updated.slug]);
  return toPostDTO(updated);
}

export async function deleteBlogPost(id: string) {
  const deleted = await prisma.post.findUnique({ where: { id } });
  if (!deleted) throw new ApiError(404, "Post nao encontrado.");

  await prisma.post.delete({ where: { id: deleted.id } });
  await invalidateBlogCaches([deleted.slug]);

  return { id: String(deleted.id) };
}
