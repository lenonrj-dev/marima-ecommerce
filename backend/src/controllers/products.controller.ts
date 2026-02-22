import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  createProduct,
  deleteProduct,
  getAdminProductById,
  getStoreProductBySlug,
  getStoreProductVariantsBySlug,
  listAdminProducts,
  listStoreProducts,
  toggleProductActivation,
  updateProduct,
} from "../services/products.service";

export const listAdminProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listAdminProducts({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    category: String(req.query.category || "").trim() || undefined,
    groupKey: String(req.query.groupKey || "").trim() || undefined,
    status: String(req.query.status || "").trim() || undefined,
    active:
      req.query.active === undefined
        ? undefined
        : String(req.query.active) === "true"
          ? true
          : String(req.query.active) === "false"
            ? false
            : undefined,
    sort: String(req.query.sort || "").trim() || undefined,
  });

  res.json(result);
});

export const createProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const created = await createProduct(req.body);
  res.status(201).json({ data: created });
});

export const getAdminProductByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getAdminProductById(String(req.params.id));
  res.json({ data });
});

export const patchProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await updateProduct(String(req.params.id), req.body);
  res.json({ data: updated });
});

export const patchProductActivationHandler = asyncHandler(async (req: Request, res: Response) => {
  const updated = await toggleProductActivation(String(req.params.id), Boolean(req.body.active));
  res.json({ data: updated });
});

export const deleteProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await deleteProduct(String(req.params.id));
  res.json({ data });
});

export const listStoreProductsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const includeVariants =
    req.query.includeVariants === undefined
      ? false
      : String(req.query.includeVariants) === "true";

  const result = await listStoreProducts({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    category: String(req.query.category || "").trim() || undefined,
    status: String(req.query.status || "").trim() || undefined,
    active:
      req.query.active === undefined
        ? true
        : String(req.query.active) === "true"
          ? true
          : String(req.query.active) === "false"
            ? false
            : true,
    sort: String(req.query.sort || "").trim() || undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    includeVariants,
  });

  res.json(result);
});

export const getStoreProductBySlugHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getStoreProductBySlug(String(req.params.slug));
  res.json({ data });
});

export const getStoreProductVariantsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getStoreProductVariantsBySlug(String(req.params.slug));
  res.json({ data });
});

