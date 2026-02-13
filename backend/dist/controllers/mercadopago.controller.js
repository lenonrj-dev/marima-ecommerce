"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mercadoPagoPaymentDebugHandler = exports.mercadoPagoCancelHandler = exports.mercadoPagoVerifyHandler = exports.mercadoPagoCheckoutProHandler = void 0;
const crypto_1 = require("crypto");
const notFound_1 = require("../middlewares/notFound");
const rbac_1 = require("../middlewares/rbac");
const auth_1 = require("../middlewares/auth");
const carts_service_1 = require("../services/carts.service");
const cookies_1 = require("../utils/cookies");
const mercadopago_service_1 = require("../services/mercadopago.service");
const MP_CANCEL_TOKEN_COOKIE = "mp_cancel_token";
function resolveCartIdentity(req, res) {
    if (req.auth?.type === "customer") {
        return { customerId: req.auth.sub };
    }
    let guestToken = req.cookies?.[carts_service_1.GUEST_CART_COOKIE];
    if (!guestToken) {
        guestToken = (0, crypto_1.randomUUID)();
        res.cookie(carts_service_1.GUEST_CART_COOKIE, guestToken, (0, cookies_1.cookieOptions)(req, 30 * 24 * 60 * 60 * 1000));
    }
    return { guestToken };
}
exports.mercadoPagoCheckoutProHandler = [
    auth_1.optionalAuth,
    (0, notFound_1.asyncHandler)(async (req, res) => {
        const identity = resolveCartIdentity(req, res);
        const data = await (0, mercadopago_service_1.createMercadoPagoCheckoutPro)({
            identity,
            orderId: req.body.orderId,
            shippingMethodId: req.body.shippingMethodId || req.body.shippingMethod,
            shippingMethod: req.body.shippingMethod,
            couponCode: req.body.couponCode,
            cashbackUsedCents: req.body.cashbackUsedCents,
            address: req.body.address,
        });
        if (data.cancelToken) {
            res.cookie(MP_CANCEL_TOKEN_COOKIE, data.cancelToken, (0, cookies_1.cookieOptions)(req, 2 * 60 * 60 * 1000));
        }
        res.status(201).json({
            data: {
                preferenceId: data.preferenceId,
                orderId: data.orderId,
            },
        });
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
    const cancelToken = req.cookies?.[MP_CANCEL_TOKEN_COOKIE] ? String(req.cookies[MP_CANCEL_TOKEN_COOKIE]) : "";
    const data = await (0, mercadopago_service_1.cancelMercadoPagoOrder)({
        orderId: req.body.orderId,
        cancelToken,
    });
    res.clearCookie(MP_CANCEL_TOKEN_COOKIE, (0, cookies_1.cookieBaseOptions)(req));
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
