import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { requireRole } from "../middlewares/rbac";
import { requireAdminAuth, optionalAuth } from "../middlewares/auth";
import { GUEST_CART_COOKIE } from "../services/carts.service";
import { cookieOptions } from "../utils/cookies";
import {
  cancelMercadoPagoOrder,
  createMercadoPagoCheckoutPro,
  getMercadoPagoPaymentDebug,
  verifyMercadoPagoPayment,
} from "../services/mercadopago.service";

function resolveCartIdentity(req: Request, res: Response) {
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

export const mercadoPagoCheckoutProHandler = [
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const identity = resolveCartIdentity(req, res);

    const data = await createMercadoPagoCheckoutPro({
      identity,
      shippingMethodId: req.body.shippingMethodId || req.body.shippingMethod,
      shippingMethod: req.body.shippingMethod,
      couponCode: req.body.couponCode,
      cashbackUsedCents: req.body.cashbackUsedCents,
      address: req.body.address,
    });

    res.status(201).json({ data });
  }),
] as const;

export const mercadoPagoVerifyHandler = asyncHandler(async (req: Request, res: Response) => {
  const paymentId = String(req.query.payment_id || req.query.collection_id || req.query.id || "").trim();

  const data = await verifyMercadoPagoPayment({
    paymentId,
    externalReference: req.query.external_reference ? String(req.query.external_reference).trim() : undefined,
    merchantOrderId: req.query.merchant_order_id ? String(req.query.merchant_order_id).trim() : undefined,
  });

  res.json({ data });
});

export const mercadoPagoCancelHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await cancelMercadoPagoOrder({
    orderId: req.body.orderId,
    cancelToken: req.body.cancelToken,
  });

  res.json({ data });
});

export const mercadoPagoPaymentDebugHandler = [
  requireAdminAuth,
  requireRole("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getMercadoPagoPaymentDebug(String(req.params.id));
    res.json({ data });
  }),
] as const;
