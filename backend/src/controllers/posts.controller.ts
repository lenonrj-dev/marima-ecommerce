import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { ApiError } from "../utils/apiError";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  listBlogCategoryCounts,
  listBlogPosts,
  type BlogStatus,
  updateBlogPost,
} from "../services/posts.service";

function parseStatusParam(raw: unknown): BlogStatus | undefined {
  const value = String(raw || "").trim().toLocaleLowerCase("pt-BR");
  if (!value) return undefined;
  if (value === "published") return "published";
  if (value === "draft") return "draft";
  if (value === "all") return "all";
  return undefined;
}

function resolveListStatus(req: Request): BlogStatus {
  const requested = parseStatusParam(req.query.status);
  const isAdmin = req.auth?.type === "admin";

  if (!requested) {
    return isAdmin ? "all" : "published";
  }

  if (!isAdmin && requested !== "published") {
    throw new ApiError(401, "Status solicitado requer autenticacao administrativa.", "AUTH_REQUIRED");
  }

  return requested;
}

export const listBlogPostsHandler = asyncHandler(async (req: Request, res: Response) => {
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

  const result = await listBlogPosts({
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

export const listBlogCategoryCountsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listBlogCategoryCounts();
  res.json({ data });
});

export const getBlogPostBySlugHandler = asyncHandler(async (req: Request, res: Response) => {
  const includeDraft = req.auth?.type === "admin";
  const data = await getBlogPostBySlug(String(req.params.slug), { includeDraft });
  res.json({ data });
});

export const getBlogPostByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getBlogPostById(String(req.params.id));
  res.json({ data });
});

export const createBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const created = await createBlogPost(req.body);
  res.status(201).json({ data: created });
});

export const patchBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await updateBlogPost(String(req.params.id), req.body);
  res.json({ data: updated });
});

export const deleteBlogPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await deleteBlogPost(String(req.params.id));
  res.json({ data });
});
