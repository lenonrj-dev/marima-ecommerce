"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../middlewares/validate");
const mercadopago_controller_1 = require("../controllers/mercadopago.controller");
const router = (0, express_1.Router)();
router.post("/mercadopago/checkout-pro", (0, validate_1.validate)({
    body: zod_1.z.object({
        orderId: zod_1.z.string().optional(),
        shippingMethodId: zod_1.z.string().optional(),
        shippingMethod: zod_1.z.string().optional(),
        couponCode: zod_1.z.string().optional(),
        cashbackUsedCents: zod_1.z.number().int().optional(),
        address: zod_1.z.object({
            fullName: zod_1.z.string().min(2),
            email: zod_1.z.string().email(),
            phone: zod_1.z.string().min(3),
            zip: zod_1.z.string().min(3),
            state: zod_1.z.string().min(2),
            city: zod_1.z.string().min(2),
            neighborhood: zod_1.z.string().min(2),
            street: zod_1.z.string().min(2),
            number: zod_1.z.string().min(1),
            complement: zod_1.z.string().optional(),
        }),
    }),
}), ...mercadopago_controller_1.mercadoPagoCheckoutProHandler);
router.get("/mercadopago/verify", mercadopago_controller_1.mercadoPagoVerifyHandler);
router.post("/mercadopago/webhook", mercadopago_controller_1.mercadoPagoWebhookHandler);
router.get("/mercadopago/webhook", mercadopago_controller_1.mercadoPagoWebhookHandler);
router.post("/mercadopago/cancel", (0, validate_1.validate)({
    body: zod_1.z.object({
        orderId: zod_1.z.string().min(1),
    }),
}), mercadopago_controller_1.mercadoPagoCancelHandler);
router.get("/mercadopago/payment/:id", ...mercadopago_controller_1.mercadoPagoPaymentDebugHandler);
exports.default = router;
