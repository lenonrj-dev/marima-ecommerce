"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAbandonedCartHandler = exports.recoverAbandonedCartHandler = exports.listAbandonedCartsHandler = exports.applyMeCartCouponHandler = exports.deleteMeCartItemHandler = exports.patchMeCartItemHandler = exports.putMeCartItemHandler = exports.getMeCartHandler = void 0;
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const notFound_1 = require("../middlewares/notFound");
const carts_service_1 = require("../services/carts.service");
const orders_service_1 = require("../services/orders.service");
function resolveIdentity(req, res) {
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
exports.getMeCartHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const identity = resolveIdentity(req, res);
    const data = await (0, carts_service_1.getCart)(identity);
    res.json({ data });
});
exports.putMeCartItemHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const identity = resolveIdentity(req, res);
    const data = await (0, carts_service_1.upsertCartItem)(identity, {
        productId: req.body.productId,
        qty: Number(req.body.qty || 1),
        variant: req.body.variant,
        sizeLabel: req.body.sizeLabel,
    });
    res.json({ data });
});
exports.patchMeCartItemHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const identity = resolveIdentity(req, res);
    const data = await (0, carts_service_1.patchCartItemQty)(identity, String(req.params.itemId), Number(req.body.qty || 1));
    res.json({ data });
});
exports.deleteMeCartItemHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const identity = resolveIdentity(req, res);
    const data = await (0, carts_service_1.deleteCartItem)(identity, String(req.params.itemId));
    res.json({ data });
});
exports.applyMeCartCouponHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const identity = resolveIdentity(req, res);
    const data = await (0, carts_service_1.applyCouponToCart)(identity, req.body.code || "");
    res.json({ data });
});
exports.listAbandonedCartsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, carts_service_1.listAbandonedCarts)({ page, limit });
    res.json(result);
});
exports.recoverAbandonedCartHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, carts_service_1.recoverAbandonedCart)(String(req.params.id), req.body.note);
    res.json({ data });
});
exports.convertAbandonedCartHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, orders_service_1.createOrderFromCart)(String(req.params.id));
    res.status(201).json({ data });
});
