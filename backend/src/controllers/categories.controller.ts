import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  createCategory,
  listCategories,
  listStoreCategories,
  updateCategory,
} from "../services/categories.service";

export const listAdminCategoriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listCategories({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    active:
      req.query.active === undefined
        ? undefined
        : String(req.query.active) === "true"
          ? true
          : false,
  });

  res.json(result);
});

export const createCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createCategory(req.body);
  res.status(201).json({ data });
});

export const patchCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateCategory(String(req.params.id), req.body);
  res.json({ data });
});

export const listStoreCategoriesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listStoreCategories();
  res.json({ data });
});

