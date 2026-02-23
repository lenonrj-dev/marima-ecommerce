"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlogPostHandler = exports.patchBlogPostHandler = exports.createBlogPostHandler = exports.getBlogPostByIdHandler = exports.getBlogPostBySlugHandler = exports.listBlogCategoryCountsHandler = exports.listBlogPostsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const apiError_1 = require("../utils/apiError");
const posts_service_1 = require("../services/posts.service");
function parseStatusParam(raw) {
    const value = String(raw || "").trim().toLocaleLowerCase("pt-BR");
    if (!value)
        return undefined;
    if (value === "published")
        return "published";
    if (value === "draft")
        return "draft";
    if (value === "all")
        return "all";
    return undefined;
}
function resolveListStatus(req) {
    const requested = parseStatusParam(req.query.status);
    const isAdmin = req.auth?.type === "admin";
    if (!requested) {
        return isAdmin ? "all" : "published";
    }
    if (!isAdmin && requested !== "published") {
        throw new apiError_1.ApiError(401, "Status solicitado requer autenticacao administrativa.", "AUTH_REQUIRED");
    }
    return requested;
}
exports.listBlogPostsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const rawTags = String(req.query.tags || "").trim();
    const tags = rawTags
        ? rawTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined;
    const rawSort = String(req.query.sort || "").trim().toLocaleLowerCase("pt-BR");
    const sort = rawSort === "newest" || rawSort === "relevance" ? rawSort : undefined;
    const result = await (0, posts_service_1.listBlogPosts)({
        page,
        limit,
        q: String(req.query.search || req.query.q || "").trim() || undefined,
        status: resolveListStatus(req),
        topic: String(req.query.topic || "").trim() || undefined,
        tags,
        sort,
    });
    res.json(result);
});
exports.listBlogCategoryCountsHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const data = await (0, posts_service_1.listBlogCategoryCounts)();
    res.json({ data });
});
exports.getBlogPostBySlugHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const includeDraft = req.auth?.type === "admin";
    const data = await (0, posts_service_1.getBlogPostBySlug)(String(req.params.slug), { includeDraft });
    res.json({ data });
});
exports.getBlogPostByIdHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, posts_service_1.getBlogPostById)(String(req.params.id));
    res.json({ data });
});
exports.createBlogPostHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const created = await (0, posts_service_1.createBlogPost)(req.body);
    res.status(201).json({ data: created });
});
exports.patchBlogPostHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const updated = await (0, posts_service_1.updateBlogPost)(String(req.params.id), req.body);
    res.json({ data: updated });
});
exports.deleteBlogPostHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, posts_service_1.deleteBlogPost)(String(req.params.id));
    res.json({ data });
});
