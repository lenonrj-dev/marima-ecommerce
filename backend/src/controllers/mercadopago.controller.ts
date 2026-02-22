import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { requireRole } from "../middlewares/rbac";
import { requireAdminAuth, requireCustomerAuth } from "../middlewares/auth";
import { cookieBaseOptions, cookieOptions } from "../utils/cookies";
import { ApiError } from "../utils/apiError";
import {
  cancelMercadoPagoOrder,
  createMercadoPagoCheckoutPro,
  getMercadoPagoPaymentDebug,
  verifyMercadoPagoPayment,
} from "../services/mercadopago.service";

const MP_CANCEL_TOKEN_COOKIE = "mp_cancel_token";

function resolveCartIdentity(req: Request) {
  if (req.auth?.type === "customer") {
    return { customerId: req.auth.sub };
  }
  throw new ApiError(401, "Acesso do cliente não autenticado.", "AUTH_REQUIRED");
}

export const mercadoPagoCheckoutProHandler = [
  requireCustomerAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const identity = resolveCartIdentity(req);

    const data = await createMercadoPagoCheckoutPro({
      identity,
      orderId: req.body.orderId,
      shippingMethodId: req.body.shippingMethodId || req.body.shippingMethod,
      shippingMethod: req.body.shippingMethod,
      couponCode: req.body.couponCode,
      cashbackUsedCents: req.body.cashbackUsedCents,
      address: req.body.address,
    });

    if (data.cancelToken) {
      res.cookie(MP_CANCEL_TOKEN_COOKIE, data.cancelToken, cookieOptions(req, 2 * 60 * 60 * 1000));
    }

    res.status(201).json({
      data: {
        preferenceId: data.preferenceId,
        orderId: data.orderId,
      },
    });
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
  const cancelToken = req.cookies?.[MP_CANCEL_TOKEN_COOKIE] ? String(req.cookies[MP_CANCEL_TOKEN_COOKIE]) : "";
  const data = await cancelMercadoPagoOrder({
    orderId: req.body.orderId,
    cancelToken,
  });

  res.clearCookie(MP_CANCEL_TOKEN_COOKIE, cookieBaseOptions(req));
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
