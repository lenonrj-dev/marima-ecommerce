"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBlogPosts = listBlogPosts;
exports.listBlogCategoryCounts = listBlogCategoryCounts;
exports.getBlogPostBySlug = getBlogPostBySlug;
exports.getBlogPostById = getBlogPostById;
exports.createBlogPost = createBlogPost;
exports.updateBlogPost = updateBlogPost;
exports.deleteBlogPost = deleteBlogPost;
const client_1 = require("@prisma/client");
const cache_1 = require("../lib/cache");
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const slug_1 = require("../utils/slug");
const BLOG_LIST_VERSION_KEY = "cache:v1:blog:listVersion";
const BLOG_LIST_TTL_SECONDS = 60 * 60 * 6;
const BLOG_POST_TTL_SECONDS = 60 * 60 * 24;
const BLOG_CATEGORY_COUNTS_TTL_SECONDS = 60 * 10;
const BLOG_TOPIC_DEFINITIONS = [
    { id: "treino", label: "Treino" },
    { id: "moda-fitness", label: "Moda fitness" },
    { id: "tecnologia-textil", label: "Tecnologia têxtil" },
    { id: "bem-estar", label: "Bem-estar" },
    { id: "estilo-casual", label: "Estilo casual" },
    { id: "novidades", label: "Novidades" },
    { id: "guias", label: "Guias" },
    { id: "marima", label: "Marima" },
];
const BLOG_TOPIC_ALIASES = new Map();
for (const topic of BLOG_TOPIC_DEFINITIONS) {
    BLOG_TOPIC_ALIASES.set(topic.id, topic.id);
    BLOG_TOPIC_ALIASES.set((0, slug_1.slugify)(topic.label), topic.id);
}
BLOG_TOPIC_ALIASES.set("moda", "moda-fitness");
BLOG_TOPIC_ALIASES.set("tecnologia", "tecnologia-textil");
BLOG_TOPIC_ALIASES.set("tecnologia-textil", "tecnologia-textil");
BLOG_TOPIC_ALIASES.set("bem-estar", "bem-estar");
BLOG_TOPIC_ALIASES.set("estilo", "estilo-casual");
BLOG_TOPIC_ALIASES.set("casual", "estilo-casual");
function resolveBlogTopicId(value) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw)
        return "novidades";
    const normalized = (0, slug_1.slugify)(raw);
    if (!normalized)
        return "novidades";
    return BLOG_TOPIC_ALIASES.get(normalized) || "novidades";
}
function resolveBlogTopicFilter(value) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw)
        return undefined;
    const normalized = (0, slug_1.slugify)(raw);
    if (!normalized)
        return undefined;
    return BLOG_TOPIC_ALIASES.get(normalized);
}
function normalizeOptionalString(value) {
    if (typeof value !== "string")
        return undefined;
    const normalized = value.trim();
    return normalized || undefined;
}
function normalizeTags(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    const tags = [];
    for (const item of value) {
        if (typeof item !== "string")
            continue;
        const tag = item.trim();
        if (!tag)
            continue;
        const key = tag.toLocaleLowerCase("pt-BR");
        if (seen.has(key))
            continue;
        seen.add(key);
        tags.push(tag);
    }
    return tags;
}
function normalizeTagFilters(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    const tags = [];
    for (const item of value) {
        if (typeof item !== "string")
            continue;
        const tag = item.trim();
        if (!tag)
            continue;
        const key = tag.toLocaleLowerCase("pt-BR");
        if (seen.has(key))
            continue;
        seen.add(key);
        tags.push(tag);
    }
    return tags;
}
function normalizeSlug(value, fallbackTitle) {
    const source = (value || "").trim() || fallbackTitle;
    const parsed = (0, slug_1.slugify)(source);
    if (!parsed)
        throw new apiError_1.ApiError(400, "Slug inválido.");
    return parsed;
}
function toIso(value) {
    if (!value)
        return undefined;
    if (value instanceof Date)
        return value.toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}
function estimateReadingMinutes(content) {
    const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}
function toPostDTO(post) {
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
async function ensureUniqueSlug(slug, ignoreId) {
    const existing = await prisma_1.prisma.post.findUnique({ where: { slug } });
    if (!existing)
        return;
    if (ignoreId && String(existing.id) === ignoreId)
        return;
    throw new apiError_1.ApiError(409, "Slug já existente.");
}
function buildStatusQuery(status) {
    if (status === "published")
        return { published: true };
    if (status === "draft")
        return { published: false };
    return {};
}
async function invalidateBlogCaches(slugs) {
    await (0, cache_1.bumpCacheVersion)(BLOG_LIST_VERSION_KEY);
    const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
    await Promise.all(uniqueSlugs.map((slug) => (0, cache_1.delCache)(`cache:v1:blog:post:${slug}`)));
}
async function listBlogPosts(input) {
    const normalizedTopic = resolveBlogTopicFilter(input.topic);
    const normalizedTags = normalizeTagFilters(input.tags);
    const normalizedSort = input.sort === "newest" ? "newest" : "relevance";
    const version = await (0, cache_1.getCacheVersion)(BLOG_LIST_VERSION_KEY, 1);
    const listHash = (0, cache_1.hashCacheQuery)({
        page: input.page,
        limit: input.limit,
        q: input.q || "",
        status: input.status,
        topic: normalizedTopic || "",
        tags: normalizedTags,
        sort: normalizedSort,
    });
    const cacheKey = `cache:v1:blog:list:v${version}:${listHash}`;
    return (0, cache_1.getOrSetCache)(cacheKey, BLOG_LIST_TTL_SECONDS, async () => {
        const offset = (input.page - 1) * input.limit;
        const useRawSearch = Boolean(input.q) || normalizedTags.length > 0;
        if (!useRawSearch) {
            const where = {
                ...buildStatusQuery(input.status),
            };
            if (normalizedTopic) {
                where.topic = normalizedTopic;
            }
            const [rows, total] = await Promise.all([
                prisma_1.prisma.post.findMany({
                    where,
                    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
                    skip: offset,
                    take: input.limit,
                }),
                prisma_1.prisma.post.count({ where }),
            ]);
            return {
                data: rows.map((post) => toPostDTO(post)),
                meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
            };
        }
        const conditions = [];
        if (input.status === "published") {
            conditions.push(client_1.Prisma.sql `p."published" = TRUE`);
        }
        else if (input.status === "draft") {
            conditions.push(client_1.Prisma.sql `p."published" = FALSE`);
        }
        if (normalizedTopic) {
            conditions.push(client_1.Prisma.sql `p."topic" = ${normalizedTopic}`);
        }
        if (normalizedTags.length > 0) {
            const tagMatches = normalizedTags.map((tag) => client_1.Prisma.sql `
          EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(p."tags", '[]'::jsonb)) AS jt(value)
            WHERE lower(jt.value) = lower(${tag})
          )
        `);
            conditions.push(client_1.Prisma.sql `(${client_1.Prisma.join(tagMatches, " OR ")})`);
        }
        if (input.q) {
            conditions.push(client_1.Prisma.sql `to_tsvector('portuguese', coalesce(p."title", '') || ' ' || coalesce(p."excerpt", '') || ' ' || coalesce(p."content", '')) @@ websearch_to_tsquery('portuguese', ${input.q})`);
        }
        const whereSql = conditions.length
            ? client_1.Prisma.sql `WHERE ${client_1.Prisma.join(conditions, " AND ")}`
            : client_1.Prisma.empty;
        const newestOrderSql = client_1.Prisma.sql `ORDER BY p."publishedAt" DESC NULLS LAST, p."updatedAt" DESC, p."createdAt" DESC`;
        const relevanceOrderSql = input.q && normalizedSort !== "newest"
            ? client_1.Prisma.sql `
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
            prisma_1.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT p.*
        FROM "Post" AS p
        ${whereSql}
        ${relevanceOrderSql}
        LIMIT ${input.limit}
        OFFSET ${offset}
      `),
            prisma_1.prisma.$queryRaw(client_1.Prisma.sql `
        SELECT COUNT(*)::bigint AS total
        FROM "Post" AS p
        ${whereSql}
      `),
        ]);
        const rawTotal = totalRows[0]?.total ?? 0;
        const total = Number(rawTotal);
        return {
            data: rows.map((post) => toPostDTO(post)),
            meta: (0, pagination_1.buildMeta)(Number.isFinite(total) ? total : 0, input.page, input.limit),
        };
    });
}
async function listBlogCategoryCounts() {
    const version = await (0, cache_1.getCacheVersion)(BLOG_LIST_VERSION_KEY, 1);
    const cacheKey = `cache:v1:blog:categories:v${version}`;
    return (0, cache_1.getOrSetCache)(cacheKey, BLOG_CATEGORY_COUNTS_TTL_SECONDS, async () => {
        const grouped = await prisma_1.prisma.post.groupBy({
            by: ["topic"],
            where: { published: true },
            _count: { _all: true },
        });
        const totals = new Map();
        for (const topic of BLOG_TOPIC_DEFINITIONS) {
            totals.set(topic.id, 0);
        }
        for (const row of grouped) {
            const topicId = resolveBlogTopicId(row.topic);
            const current = totals.get(topicId) || 0;
            totals.set(topicId, current + Math.max(0, Number(row._count._all || 0)));
        }
        const counts = BLOG_TOPIC_DEFINITIONS.map((topic) => ({
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
async function getBlogPostBySlug(slug, options) {
    const parsedSlug = normalizeSlug(slug, slug);
    if (options?.includeDraft) {
        const post = await prisma_1.prisma.post.findUnique({ where: { slug: parsedSlug } });
        if (!post)
            throw new apiError_1.ApiError(404, "Post não encontrado.");
        return toPostDTO(post);
    }
    return (0, cache_1.getOrSetCache)(`cache:v1:blog:post:${parsedSlug}`, BLOG_POST_TTL_SECONDS, async () => {
        const post = await prisma_1.prisma.post.findFirst({ where: { slug: parsedSlug, published: true } });
        if (!post)
            throw new apiError_1.ApiError(404, "Post não encontrado.");
        return toPostDTO(post);
    });
}
async function getBlogPostById(id) {
    const post = await prisma_1.prisma.post.findUnique({ where: { id } });
    if (!post)
        throw new apiError_1.ApiError(404, "Post não encontrado.");
    return toPostDTO(post);
}
async function createBlogPost(input) {
    const title = normalizeOptionalString(input.title);
    const content = normalizeOptionalString(input.content);
    if (!title)
        throw new apiError_1.ApiError(400, "Título é obrigatório.");
    if (!content)
        throw new apiError_1.ApiError(400, "Conteúdo é obrigatório.");
    const slug = normalizeSlug(input.slug, title);
    await ensureUniqueSlug(slug);
    const published = Boolean(input.published);
    const publishedAt = published
        ? input.publishedAt
            ? new Date(input.publishedAt)
            : new Date()
        : undefined;
    const created = await prisma_1.prisma.post.create({
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
            readingMinutes: typeof input.readingMinutes === "number" && Number.isFinite(input.readingMinutes)
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
async function updateBlogPost(id, input) {
    const post = await prisma_1.prisma.post.findUnique({ where: { id } });
    if (!post)
        throw new apiError_1.ApiError(404, "Post não encontrado.");
    const previousSlug = String(post.slug || "");
    const nextData = {};
    let nextTitle = post.title;
    if (input.title !== undefined) {
        const title = normalizeOptionalString(input.title);
        if (!title)
            throw new apiError_1.ApiError(400, "Título é obrigatório.");
        nextTitle = title;
        nextData.title = title;
    }
    if (input.slug !== undefined) {
        const slug = normalizeSlug(input.slug, nextTitle);
        await ensureUniqueSlug(slug, post.id);
        nextData.slug = slug;
    }
    if (input.excerpt !== undefined)
        nextData.excerpt = normalizeOptionalString(input.excerpt) || "";
    if (input.content !== undefined) {
        const content = normalizeOptionalString(input.content);
        if (!content)
            throw new apiError_1.ApiError(400, "Conteúdo é obrigatório.");
        nextData.content = content;
        if (input.readingMinutes === undefined) {
            nextData.readingMinutes = estimateReadingMinutes(content);
        }
    }
    if (input.coverImage !== undefined)
        nextData.coverImage = normalizeOptionalString(input.coverImage) || "";
    if (input.tags !== undefined)
        nextData.tags = normalizeTags(input.tags);
    if (input.topic !== undefined)
        nextData.topic = resolveBlogTopicId(input.topic);
    if (input.topic2 !== undefined)
        nextData.topic2 = normalizeOptionalString(input.topic2) || null;
    if (input.featured !== undefined)
        nextData.featured = Boolean(input.featured);
    if (input.authorName !== undefined)
        nextData.authorName = normalizeOptionalString(input.authorName) || "";
    if (input.readingMinutes !== undefined) {
        if (!Number.isFinite(input.readingMinutes)) {
            throw new apiError_1.ApiError(400, "Tempo de leitura inválido.");
        }
        nextData.readingMinutes = Math.max(1, Math.floor(input.readingMinutes));
    }
    if (input.published !== undefined) {
        const nextPublished = Boolean(input.published);
        nextData.published = nextPublished;
        if (nextPublished) {
            nextData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : post.publishedAt || new Date();
        }
        else {
            nextData.publishedAt = null;
        }
    }
    else if (input.publishedAt !== undefined) {
        nextData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    }
    const updated = await prisma_1.prisma.post.update({
        where: { id },
        data: nextData,
    });
    await invalidateBlogCaches([previousSlug, updated.slug]);
    return toPostDTO(updated);
}
async function deleteBlogPost(id) {
    const deleted = await prisma_1.prisma.post.findUnique({ where: { id } });
    if (!deleted)
        throw new apiError_1.ApiError(404, "Post não encontrado.");
    await prisma_1.prisma.post.delete({ where: { id: deleted.id } });
    await invalidateBlogCaches([deleted.slug]);
    return { id: String(deleted.id) };
}
