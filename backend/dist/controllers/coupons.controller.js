"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCouponHandler = exports.toggleCouponHandler = exports.patchCouponHandler = exports.createCouponHandler = exports.listCouponsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const coupons_service_1 = require("../services/coupons.service");
exports.listCouponsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, coupons_service_1.listCoupons)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
    });
    res.json(result);
});
exports.createCouponHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, coupons_service_1.createCoupon)(req.body);
    res.status(201).json({ data });
});
exports.patchCouponHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, coupons_service_1.updateCoupon)(String(req.params.id), req.body);
    res.json({ data });
});
exports.toggleCouponHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, coupons_service_1.toggleCoupon)(String(req.params.id));
    res.json({ data });
});
exports.validateCouponHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const subtotalCents = Number(req.body.subtotalCents || req.body.subtotal || 0);
    const data = await (0, coupons_service_1.validateCoupon)(req.body.code, subtotalCents);
    res.json({ data });
});
