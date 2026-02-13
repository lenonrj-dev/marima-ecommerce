import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { isProd } from "../config/env";
import { asyncHandler } from "../middlewares/notFound";
import {
  applyCouponToCart,
  deleteCartItem,
  GUEST_CART_COOKIE,
  getCart,
  listAbandonedCarts,
  patchCartItemQty,
  recoverAbandonedCart,
  upsertCartItem,
} from "../services/carts.service";
import { createOrderFromCart } from "../services/orders.service";

function resolveIdentity(req: Request, res: Response) {
  if (req.auth?.type === "customer") {
    return { customerId: req.auth.sub };
  }

  let guestToken = req.cookies?.[GUEST_CART_COOKIE] as string | undefined;
  if (!guestToken) {
    guestToken = randomUUID();
    res.cookie(GUEST_CART_COOKIE, guestToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return { guestToken };
}

export const getMeCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveIdentity(req, res);
  const data = await getCart(identity);
  res.json({ data });
});

export const putMeCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveIdentity(req, res);
  const data = await upsertCartItem(identity, {
    productId: req.body.productId,
    qty: Number(req.body.qty || 1),
    variant: req.body.variant,
    sizeLabel: req.body.sizeLabel,
  });

  res.json({ data });
});

export const patchMeCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveIdentity(req, res);
  const data = await patchCartItemQty(identity, String(req.params.itemId), Number(req.body.qty || 1));
  res.json({ data });
});

export const deleteMeCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveIdentity(req, res);
  const data = await deleteCartItem(identity, String(req.params.itemId));
  res.json({ data });
});

export const applyMeCartCouponHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveIdentity(req, res);
  const data = await applyCouponToCart(identity, req.body.code || "");
  res.json({ data });
});

export const listAbandonedCartsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const result = await listAbandonedCarts({ page, limit });
  res.json(result);
});

export const recoverAbandonedCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await recoverAbandonedCart(String(req.params.id), req.body.note);
  res.json({ data });
});

export const convertAbandonedCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createOrderFromCart(String(req.params.id));
  res.status(201).json({ data });
});

