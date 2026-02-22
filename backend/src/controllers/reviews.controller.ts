import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  createMeReview,
  deleteAdminReview,
  getProductReviewSummary,
  listAdminReviews,
  listMeReviews,
  listPublishedProductReviews,
  patchAdminReviewStatus,
} from "../services/reviews.service";

export const listStoreProductReviewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));

  const result = await listPublishedProductReviews({
    productId: String(req.params.productId || ""),
    page,
    limit,
    sort: String(req.query.sort || ""),
  });

  res.json(result);
});

export const getStoreProductReviewsSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getProductReviewSummary(String(req.params.productId || ""));
  res.json({ data: result.summary });
});

export const createMeReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createMeReview(req.auth!.sub, {
    productId: String(req.body.productId || ""),
    rating: Number(req.body.rating || 0),
    comment: String(req.body.comment || ""),
  });

  res.status(201).json({ data });
});

export const listMeReviewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listMeReviews(req.auth!.sub, { page, limit });
  res.json(result);
});

export const listAdminReviewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listAdminReviews({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    productId: String(req.query.productId || "").trim() || undefined,
    status: (String(req.query.status || "").trim() || "all") as "all" | "published" | "pending" | "hidden",
  });

  res.json(result);
});

export const patchAdminReviewStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await patchAdminReviewStatus(String(req.params.id || ""), req.body.status);
  res.json({ data });
});

export const deleteAdminReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteAdminReview(String(req.params.id || ""));
  res.status(204).send();
});
