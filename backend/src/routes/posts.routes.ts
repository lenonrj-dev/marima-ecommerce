import { Router } from "express";
import { z } from "zod";
import {
  createBlogPostHandler,
  deleteBlogPostHandler,
  getBlogPostByIdHandler,
  getBlogPostBySlugHandler,
  listBlogCategoryCountsHandler,
  listBlogPostsHandler,
  patchBlogPostHandler,
} from "../controllers/posts.controller";
import { optionalAuth, requireAdminAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { validate } from "../middlewares/validate";

const router = Router();
const idPattern = "[a-z0-9]{25}|[0-9a-fA-F-]{36}";
const postPatchSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  content: z.string().min(3).optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  topic: z.string().optional(),
  topic2: z.string().optional(),
  featured: z.boolean().optional(),
  readingMinutes: z.number().int().min(1).optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().optional(),
  authorName: z.string().optional(),
});

router.get("/categories/counts", optionalAuth, listBlogCategoryCountsHandler);
router.get("/posts", optionalAuth, listBlogPostsHandler);
router.get("/posts/id/:id", requireAdminAuth, requireRole("admin", "marketing"), getBlogPostByIdHandler);
router.get(`/posts/:id(${idPattern})`, requireAdminAuth, requireRole("admin", "marketing"), getBlogPostByIdHandler);
router.get("/posts/:slug", optionalAuth, getBlogPostBySlugHandler);

router.post(
  "/posts",
  requireAdminAuth,
  requireRole("admin", "marketing"),
  validate({
    body: z.object({
      title: z.string().min(2),
      slug: z.string().min(1).optional(),
      excerpt: z.string().optional(),
      content: z.string().min(3),
      coverImage: z.string().optional(),
      tags: z.array(z.string()).optional(),
      topic: z.string().optional(),
      topic2: z.string().optional(),
      featured: z.boolean().optional(),
      readingMinutes: z.number().int().min(1).optional(),
      published: z.boolean().optional(),
      publishedAt: z.string().optional(),
      authorName: z.string().optional(),
    }),
  }),
  createBlogPostHandler,
);

router.patch(
  "/posts/:id",
  requireAdminAuth,
  requireRole("admin", "marketing"),
  validate({ body: postPatchSchema }),
  patchBlogPostHandler,
);
router.put(
  "/posts/:id",
  requireAdminAuth,
  requireRole("admin", "marketing"),
  validate({ body: postPatchSchema }),
  patchBlogPostHandler,
);
router.post(
  "/posts/:id",
  requireAdminAuth,
  requireRole("admin", "marketing"),
  validate({ body: postPatchSchema }),
  patchBlogPostHandler,
);

router.delete("/posts/:id", requireAdminAuth, requireRole("admin", "marketing"), deleteBlogPostHandler);

export default router;
