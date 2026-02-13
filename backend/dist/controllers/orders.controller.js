"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeOrderByIdHandler = exports.listMeOrdersHandler = exports.createStoreOrderHandler = exports.patchAdminOrderStatusHandler = exports.getAdminOrderByIdHandler = exports.listAdminOrdersHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const orders_service_1 = require("../services/orders.service");
exports.listAdminOrdersHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, orders_service_1.listAdminOrders)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        status: String(req.query.status || "").trim() || undefined,
    });
    res.json(result);
});
exports.getAdminOrderByIdHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, orders_service_1.getAdminOrderById)(String(req.params.id));
    res.json({ data });
});
exports.patchAdminOrderStatusHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, orders_service_1.updateOrderStatus)(String(req.params.id), req.body.status);
    res.json({ data });
});
exports.createStoreOrderHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const payload = req.body;
    const items = (payload.items || []).map((item) => ({
        id: item.id,
        qty: Number(item.qty || 1),
        variant: item.variant,
        sizeLabel: item.sizeLabel,
    }));
    const data = await (0, orders_service_1.createStoreOrder)({
        customerId: req.auth?.type === "customer" ? req.auth.sub : undefined,
        cartId: payload.cartId,
        channel: payload.channel || "Site",
        shippingMethod: payload.shippingMethod || payload.shippingMethodId || "Padrão",
        paymentMethod: payload.paymentMethod || "Pix",
        couponCode: payload.couponCode,
        cashbackUsedCents: payload.cashbackUsedCents,
        items,
        address: payload.address,
    });
    res.status(201).json({ data });
});
exports.listMeOrdersHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, orders_service_1.listMeOrders)(req.auth.sub, { page, limit });
    res.json(result);
});
exports.getMeOrderByIdHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, orders_service_1.getMeOrderById)(req.auth.sub, String(req.params.id));
    res.json({ data });
});
