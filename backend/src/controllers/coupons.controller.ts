import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { createCoupon, listCoupons, toggleCoupon, updateCoupon, validateCoupon } from "../services/coupons.service";

export const listCouponsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listCoupons({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
  });

  res.json(result);
});

export const createCouponHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createCoupon(req.body);
  res.status(201).json({ data });
});

export const patchCouponHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateCoupon(String(req.params.id), req.body);
  res.json({ data });
});

export const toggleCouponHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await toggleCoupon(String(req.params.id));
  res.json({ data });
});

export const validateCouponHandler = asyncHandler(async (req: Request, res: Response) => {
  const subtotalCents = Number(req.body.subtotalCents || req.body.subtotal || 0);
  const data = await validateCoupon(req.body.code, subtotalCents);
  res.json({ data });
});

