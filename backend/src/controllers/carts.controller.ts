import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { cookieOptions } from "../utils/cookies";
import { asyncHandler } from "../middlewares/notFound";
import {
  applyCouponToCart,
  CartIdentity,
  createSharedCartLink,
  deleteSavedCartForCustomer,
  deleteCartItem,
  GUEST_CART_COOKIE,
  getCart,
  getSavedCartForCustomer,
  getSharedCartByToken,
  importSharedCartByToken,
  listAbandonedCarts,
  listSavedCartsForCustomer,
  loadSavedCartForCustomer,
  patchCartItemQty,
  recoverAbandonedCart,
  revokeSavedCartShareForCustomer,
  removeCouponFromCart,
  saveCartSnapshotForCustomer,
  shareSavedCartForCustomer,
  upsertCartItem,
} from "../services/carts.service";
import { createOrderFromCart } from "../services/orders.service";

export function resolveCartIdentity(req: Request, res: Response): CartIdentity {
  if (req.auth?.type === "customer") {
    return { customerId: req.auth.sub };
  }

  let guestToken = req.cookies?.[GUEST_CART_COOKIE] as string | undefined;
  if (!guestToken) {
    guestToken = randomUUID();
    res.cookie(GUEST_CART_COOKIE, guestToken, cookieOptions(req, 30 * 24 * 60 * 60 * 1000));
  }

  return { guestToken };
}

export const getMeCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await getCart(identity);
  res.json({ data });
});

export const putMeCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await upsertCartItem(identity, {
    productId: req.body.productId,
    qty: Number(req.body.qty || 1),
    variant: req.body.variant,
    sizeLabel: req.body.sizeLabel,
  });

  res.json({ data });
});

export const patchMeCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await patchCartItemQty(identity, String(req.params.itemId), Number(req.body.qty || 1));
  res.json({ data });
});

export const deleteMeCartItemHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await deleteCartItem(identity, String(req.params.itemId));
  res.json({ data });
});

export const applyMeCartCouponHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await applyCouponToCart(identity, req.body.code || "");
  res.json({ data });
});

export const removeMeCartCouponHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await removeCouponFromCart(identity);
  res.json({ data });
});

export const saveMeCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.auth?.sub || "";
  const data = await saveCartSnapshotForCustomer(customerId);
  res.status(201).json({ data });
});

export const listMeSavedCartsHandler = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.auth?.sub || "";
  const data = await listSavedCartsForCustomer(customerId);
  res.json({ data });
});

export const getMeSavedCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.auth?.sub || "";
  const data = await getSavedCartForCustomer(customerId, String(req.params.savedCartId));
  res.json({ data });
});

export const deleteMeSavedCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.auth?.sub || "";
  await deleteSavedCartForCustomer(customerId, String(req.params.savedCartId));
  res.status(204).send();
});

export const shareMeSavedCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.auth?.sub || "";
  const data = await shareSavedCartForCustomer(customerId, String(req.params.savedCartId));
  res.json({ data });
});

export const revokeMeSavedCartShareHandler = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.auth?.sub || "";
  await revokeSavedCartShareForCustomer(customerId, String(req.params.savedCartId));
  res.status(204).send();
});

export const loadMeSavedCartHandler = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.auth?.sub || "";
  const data = await loadSavedCartForCustomer(customerId, String(req.params.savedCartId));
  res.json({ data });
});

export const createCartShareHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await createSharedCartLink(identity);
  res.status(201).json({ data });
});

export const getCartShareHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getSharedCartByToken(String(req.params.token));
  res.json({ data });
});

export const importCartShareHandler = asyncHandler(async (req: Request, res: Response) => {
  const identity = resolveCartIdentity(req, res);
  const data = await importSharedCartByToken(identity, String(req.params.token));
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
