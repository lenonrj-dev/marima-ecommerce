import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  createStoreOrder,
  getAdminOrderById,
  getMeOrderById,
  listAdminOrders,
  listMeOrders,
  updateOrderStatus,
} from "../services/orders.service";

export const listAdminOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listAdminOrders({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    status: String(req.query.status || "").trim() || undefined,
  });

  res.json(result);
});

export const getAdminOrderByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getAdminOrderById(String(req.params.id));
  res.json({ data });
});

export const patchAdminOrderStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateOrderStatus(String(req.params.id), req.body.status);
  res.json({ data });
});

export const createStoreOrderHandler = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;

  const items = (payload.items || []).map((item: any) => ({
    id: item.id,
    qty: Number(item.qty || 1),
    variant: item.variant,
    sizeLabel: item.sizeLabel,
  }));

  const data = await createStoreOrder({
    customerId: req.auth?.type === "customer" ? req.auth.sub : undefined,
    cartId: payload.cartId,
    channel: payload.channel || "Site",
    shippingMethod: payload.shippingMethod || payload.shippingMethodId || "Padrão",
    paymentMethod: payload.paymentMethod || "Pix",
    couponCode: payload.couponCode,
    cashbackUsedCents: payload.cashbackUsedCents,
    items,
    address: payload.address,
  });

  res.status(201).json({ data });
});

export const listMeOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listMeOrders(req.auth!.sub, { page, limit });
  res.json(result);
});

export const getMeOrderByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getMeOrderById(req.auth!.sub, String(req.params.id));
  res.json({ data });
});

