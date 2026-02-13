"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mercadoPagoPaymentDebugHandler = exports.mercadoPagoCancelHandler = exports.mercadoPagoVerifyHandler = exports.mercadoPagoCheckoutProHandler = void 0;
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const notFound_1 = require("../middlewares/notFound");
const rbac_1 = require("../middlewares/rbac");
const auth_1 = require("../middlewares/auth");
const carts_service_1 = require("../services/carts.service");
const mercadopago_service_1 = require("../services/mercadopago.service");
function resolveCartIdentity(req, res) {
    if (req.auth?.type === "customer") {
        return { customerId: req.auth.sub };
    }
    let guestToken = req.cookies?.[carts_service_1.GUEST_CART_COOKIE];
    if (!guestToken) {
        guestToken = (0, crypto_1.randomUUID)();
        res.cookie(carts_service_1.GUEST_CART_COOKIE, guestToken, {
            httpOnly: true,
            secure: env_1.isProd,
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
    }
    return { guestToken };
}
exports.mercadoPagoCheckoutProHandler = [
    auth_1.optionalAuth,
    (0, notFound_1.asyncHandler)(async (req, res) => {
        const identity = resolveCartIdentity(req, res);
        const data = await (0, mercadopago_service_1.createMercadoPagoCheckoutPro)({
            identity,
            shippingMethodId: req.body.shippingMethodId || req.body.shippingMethod,
            shippingMethod: req.body.shippingMethod,
            couponCode: req.body.couponCode,
            cashbackUsedCents: req.body.cashbackUsedCents,
            address: req.body.address,
        });
        res.status(201).json({ data });
    }),
];
exports.mercadoPagoVerifyHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const paymentId = String(req.query.payment_id || req.query.collection_id || req.query.id || "").trim();
    const data = await (0, mercadopago_service_1.verifyMercadoPagoPayment)({
        paymentId,
        externalReference: req.query.external_reference ? String(req.query.external_reference).trim() : undefined,
        merchantOrderId: req.query.merchant_order_id ? String(req.query.merchant_order_id).trim() : undefined,
    });
    res.json({ data });
});
exports.mercadoPagoCancelHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, mercadopago_service_1.cancelMercadoPagoOrder)({
        orderId: req.body.orderId,
        cancelToken: req.body.cancelToken,
    });
    res.json({ data });
});
exports.mercadoPagoPaymentDebugHandler = [
    auth_1.requireAdminAuth,
    (0, rbac_1.requireRole)("admin"),
    (0, notFound_1.asyncHandler)(async (req, res) => {
        const data = await (0, mercadopago_service_1.getMercadoPagoPaymentDebug)(String(req.params.id));
        res.json({ data });
    }),
];
