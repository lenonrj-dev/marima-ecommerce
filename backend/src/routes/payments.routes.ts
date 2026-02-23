import { Router } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate";
import {
  mercadoPagoCancelHandler,
  mercadoPagoCheckoutProHandler,
  mercadoPagoPaymentDebugHandler,
  mercadoPagoVerifyHandler,
  mercadoPagoWebhookHandler,
} from "../controllers/mercadopago.controller";

const router = Router();

router.post(
  "/mercadopago/checkout-pro",
  validate({
    body: z.object({
      orderId: z.string().optional(),
      shippingMethodId: z.string().optional(),
      shippingMethod: z.string().optional(),
      couponCode: z.string().optional(),
      cashbackUsedCents: z.number().int().optional(),
      address: z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(3),
        zip: z.string().min(3),
        state: z.string().min(2),
        city: z.string().min(2),
        neighborhood: z.string().min(2),
        street: z.string().min(2),
        number: z.string().min(1),
        complement: z.string().optional(),
      }),
    }),
  }),
  ...mercadoPagoCheckoutProHandler,
);

router.get("/mercadopago/verify", mercadoPagoVerifyHandler);
router.post("/mercadopago/webhook", mercadoPagoWebhookHandler);
router.get("/mercadopago/webhook", mercadoPagoWebhookHandler);

router.post(
  "/mercadopago/cancel",
  validate({
    body: z.object({
      orderId: z.string().min(1),
    }),
  }),
  mercadoPagoCancelHandler,
);

router.get("/mercadopago/payment/:id", ...mercadoPagoPaymentDebugHandler);

export default router;
