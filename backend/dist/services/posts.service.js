"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBlogPosts = listBlogPosts;
exports.listBlogCategoryCounts = listBlogCategoryCounts;
exports.getBlogPostBySlug = getBlogPostBySlug;
exports.getBlogPostById = getBlogPostById;
exports.createBlogPost = createBlogPost;
exports.updateBlogPost = updateBlogPost;
exports.deleteBlogPost = deleteBlogPost;
const cache_1 = require("../lib/cache");
const Post_1 = require("../models/Post");
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
    { id: "tecnologia-textil", label: "Tecnologia textil" },
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
function normalizeSlug(value, fallbackTitle) {
    const source = (value || "").trim() || fallbackTitle;
    const parsed = (0, slug_1.slugify)(source);
    if (!parsed)
        throw new apiError_1.ApiError(400, "Slug invalido.");
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
        id: String(post._id),
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
    const existing = await Post_1.PostModel.findOne({ slug });
    if (!existing)
        return;
    if (ignoreId && String(existing._id) === ignoreId)
        return;
    throw new apiError_1.ApiError(409, "Slug ja existente.");
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
    const version = await (0, cache_1.getCacheVersion)(BLOG_LIST_VERSION_KEY, 1);
    const listHash = (0, cache_1.hashCacheQuery)({
        page: input.page,
        limit: input.limit,
        q: input.q || "",
        status: input.status,
    });
    const cacheKey = `cache:v1:blog:list:v${version}:${listHash}`;
    return (0, cache_1.getOrSetCache)(cacheKey, BLOG_LIST_TTL_SECONDS, async () => {
        const query = {
            ...buildStatusQuery(input.status),
        };
        if (input.q) {
            query.$or = [
                { title: { $regex: input.q, $options: "i" } },
                { slug: { $regex: input.q, $options: "i" } },
                { excerpt: { $regex: input.q, $options: "i" } },
                { tags: { $elemMatch: { $regex: input.q, $options: "i" } } },
            ];
        }
        const [rows, total] = await Promise.all([
            Post_1.PostModel.find(query)
                .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
                .skip((input.page - 1) * input.limit)
                .limit(input.limit),
            Post_1.PostModel.countDocuments(query),
        ]);
        return {
            data: rows.map((post) => toPostDTO(post)),
            meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
        };
    });
}
async function listBlogCategoryCounts() {
    const version = await (0, cache_1.getCacheVersion)(BLOG_LIST_VERSION_KEY, 1);
    const cacheKey = `cache:v1:blog:categories:v${version}`;
    return (0, cache_1.getOrSetCache)(cacheKey, BLOG_CATEGORY_COUNTS_TTL_SECONDS, async () => {
        const grouped = (await Post_1.PostModel.aggregate([
            { $match: { published: true } },
            { $group: { _id: "$topic", count: { $sum: 1 } } },
        ]));
        const totals = new Map();
        for (const topic of BLOG_TOPIC_DEFINITIONS) {
            totals.set(topic.id, 0);
        }
        for (const row of grouped) {
            const topicId = resolveBlogTopicId(row._id);
            const current = totals.get(topicId) || 0;
            totals.set(topicId, current + Math.max(0, Number(row.count || 0)));
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
        const post = await Post_1.PostModel.findOne({ slug: parsedSlug });
        if (!post)
            throw new apiError_1.ApiError(404, "Post nao encontrado.");
        return toPostDTO(post);
    }
    return (0, cache_1.getOrSetCache)(`cache:v1:blog:post:${parsedSlug}`, BLOG_POST_TTL_SECONDS, async () => {
        const post = await Post_1.PostModel.findOne({ slug: parsedSlug, published: true });
        if (!post)
            throw new apiError_1.ApiError(404, "Post nao encontrado.");
        return toPostDTO(post);
    });
}
async function getBlogPostById(id) {
    const post = await Post_1.PostModel.findById(id);
    if (!post)
        throw new apiError_1.ApiError(404, "Post nao encontrado.");
    return toPostDTO(post);
}
async function createBlogPost(input) {
    const title = normalizeOptionalString(input.title);
    const content = normalizeOptionalString(input.content);
    if (!title)
        throw new apiError_1.ApiError(400, "Titulo e obrigatorio.");
    if (!content)
        throw new apiError_1.ApiError(400, "Conteudo e obrigatorio.");
    const slug = normalizeSlug(input.slug, title);
    await ensureUniqueSlug(slug);
    const published = Boolean(input.published);
    const publishedAt = published
        ? input.publishedAt
            ? new Date(input.publishedAt)
            : new Date()
        : undefined;
    const created = await Post_1.PostModel.create({
        title,
        slug,
        excerpt: normalizeOptionalString(input.excerpt) || "",
        content,
        coverImage: normalizeOptionalString(input.coverImage) || "",
        tags: normalizeTags(input.tags),
        topic: normalizeOptionalString(input.topic) || "novidades",
        topic2: normalizeOptionalString(input.topic2),
        featured: Boolean(input.featured),
        readingMinutes: typeof input.readingMinutes === "number" && Number.isFinite(input.readingMinutes)
            ? Math.max(1, Math.floor(input.readingMinutes))
            : estimateReadingMinutes(content),
        published,
        publishedAt,
        authorName: normalizeOptionalString(input.authorName) || "",
    });
    await invalidateBlogCaches([created.slug]);
    return toPostDTO(created);
}
async function updateBlogPost(id, input) {
    const post = await Post_1.PostModel.findById(id);
    if (!post)
        throw new apiError_1.ApiError(404, "Post nao encontrado.");
    const previousSlug = String(post.slug || "");
    if (input.title !== undefined) {
        const title = normalizeOptionalString(input.title);
        if (!title)
            throw new apiError_1.ApiError(400, "Titulo e obrigatorio.");
        post.title = title;
    }
    if (input.slug !== undefined) {
        const slug = normalizeSlug(input.slug, post.title);
        await ensureUniqueSlug(slug, String(post._id));
        post.slug = slug;
    }
    if (input.excerpt !== undefined)
        post.excerpt = normalizeOptionalString(input.excerpt) || "";
    if (input.content !== undefined) {
        const content = normalizeOptionalString(input.content);
        if (!content)
            throw new apiError_1.ApiError(400, "Conteudo e obrigatorio.");
        post.content = content;
        if (input.readingMinutes === undefined) {
            post.readingMinutes = estimateReadingMinutes(content);
        }
    }
    if (input.coverImage !== undefined)
        post.coverImage = normalizeOptionalString(input.coverImage) || "";
    if (input.tags !== undefined)
        post.tags = normalizeTags(input.tags);
    if (input.topic !== undefined)
        post.topic = normalizeOptionalString(input.topic) || "novidades";
    if (input.topic2 !== undefined)
        post.topic2 = normalizeOptionalString(input.topic2);
    if (input.featured !== undefined)
        post.featured = Boolean(input.featured);
    if (input.authorName !== undefined)
        post.authorName = normalizeOptionalString(input.authorName) || "";
    if (input.readingMinutes !== undefined) {
        if (!Number.isFinite(input.readingMinutes)) {
            throw new apiError_1.ApiError(400, "Tempo de leitura invalido.");
        }
        post.readingMinutes = Math.max(1, Math.floor(input.readingMinutes));
    }
    if (input.published !== undefined) {
        const nextPublished = Boolean(input.published);
        post.published = nextPublished;
        if (nextPublished) {
            post.publishedAt = input.publishedAt ? new Date(input.publishedAt) : post.publishedAt || new Date();
        }
        else {
            post.publishedAt = undefined;
        }
    }
    else if (input.publishedAt !== undefined) {
        post.publishedAt = input.publishedAt ? new Date(input.publishedAt) : undefined;
    }
    await post.save();
    await invalidateBlogCaches([previousSlug, post.slug]);
    return toPostDTO(post);
}
async function deleteBlogPost(id) {
    const deleted = await Post_1.PostModel.findById(id);
    if (!deleted)
        throw new apiError_1.ApiError(404, "Post nao encontrado.");
    const slug = String(deleted.slug || "");
    await deleted.deleteOne();
    await invalidateBlogCaches([slug]);
    return { id: String(deleted._id) };
}
