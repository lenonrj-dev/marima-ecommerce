"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const posts_controller_1 = require("../controllers/posts.controller");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const validate_1 = require("../middlewares/validate");
const comments_controller_1 = require("../modules/blog/comments/comments.controller");
const comments_validators_1 = require("../modules/blog/comments/comments.validators");
const router = (0, express_1.Router)();
const idPattern = "[a-z0-9]{25}|[0-9a-fA-F-]{36}";
const postPatchSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    slug: zod_1.z.string().min(1).optional(),
    excerpt: zod_1.z.string().optional(),
    content: zod_1.z.string().min(3).optional(),
    coverImage: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    topic: zod_1.z.string().optional(),
    topic2: zod_1.z.string().optional(),
    featured: zod_1.z.boolean().optional(),
    readingMinutes: zod_1.z.number().int().min(1).optional(),
    published: zod_1.z.boolean().optional(),
    publishedAt: zod_1.z.string().optional(),
    authorName: zod_1.z.string().optional(),
});
router.get("/categories/counts", auth_1.optionalAuth, posts_controller_1.listBlogCategoryCountsHandler);
router.get("/posts", auth_1.optionalAuth, posts_controller_1.listBlogPostsHandler);
router.get("/posts/:slug/comments", auth_1.optionalAuth, (0, validate_1.validate)({
    params: comments_validators_1.postCommentParamsSchema,
    query: comments_validators_1.postCommentQuerySchema,
}), comments_controller_1.listPostCommentsHandler);
router.post("/posts/:slug/comments", auth_1.requireCustomerAuth, (0, validate_1.validate)({
    params: comments_validators_1.postCommentParamsSchema,
    body: comments_validators_1.postCommentBodySchema,
}), comments_controller_1.createPostCommentHandler);
router.get("/posts/id/:id", auth_1.requireAdminAuth, (0, rbac_1.requireRole)("admin", "marketing"), posts_controller_1.getBlogPostByIdHandler);
router.get(`/posts/:id(${idPattern})`, auth_1.requireAdminAuth, (0, rbac_1.requireRole)("admin", "marketing"), posts_controller_1.getBlogPostByIdHandler);
router.get("/posts/:slug", auth_1.optionalAuth, posts_controller_1.getBlogPostBySlugHandler);
router.post("/posts", auth_1.requireAdminAuth, (0, rbac_1.requireRole)("admin", "marketing"), (0, validate_1.validate)({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2),
        slug: zod_1.z.string().min(1).optional(),
        excerpt: zod_1.z.string().optional(),
        content: zod_1.z.string().min(3),
        coverImage: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        topic: zod_1.z.string().optional(),
        topic2: zod_1.z.string().optional(),
        featured: zod_1.z.boolean().optional(),
        readingMinutes: zod_1.z.number().int().min(1).optional(),
        published: zod_1.z.boolean().optional(),
        publishedAt: zod_1.z.string().optional(),
        authorName: zod_1.z.string().optional(),
    }),
}), posts_controller_1.createBlogPostHandler);
router.patch("/posts/:id", auth_1.requireAdminAuth, (0, rbac_1.requireRole)("admin", "marketing"), (0, validate_1.validate)({ body: postPatchSchema }), posts_controller_1.patchBlogPostHandler);
router.put("/posts/:id", auth_1.requireAdminAuth, (0, rbac_1.requireRole)("admin", "marketing"), (0, validate_1.validate)({ body: postPatchSchema }), posts_controller_1.patchBlogPostHandler);
router.post("/posts/:id", auth_1.requireAdminAuth, (0, rbac_1.requireRole)("admin", "marketing"), (0, validate_1.validate)({ body: postPatchSchema }), posts_controller_1.patchBlogPostHandler);
router.delete("/posts/:id", auth_1.requireAdminAuth, (0, rbac_1.requireRole)("admin", "marketing"), posts_controller_1.deleteBlogPostHandler);
exports.default = router;
