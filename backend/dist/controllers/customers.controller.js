"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMeFavoriteHandler = exports.createMeFavoriteHandler = exports.listMeFavoritesHandler = exports.deleteMeAddressHandler = exports.patchMeAddressHandler = exports.createMeAddressHandler = exports.listMeAddressesHandler = exports.patchMeProfileHandler = exports.getMeProfileHandler = exports.listAdminCustomerOrdersHandler = exports.patchAdminCustomerHandler = exports.getAdminCustomerByIdHandler = exports.listAdminCustomersHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const customers_service_1 = require("../services/customers.service");
function currentCustomerId(req) {
    return req.auth?.sub || "";
}
exports.listAdminCustomersHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, customers_service_1.listAdminCustomers)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        segment: String(req.query.segment || "").trim() || undefined,
    });
    res.json(result);
});
exports.getAdminCustomerByIdHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.getAdminCustomerById)(String(req.params.id));
    res.json({ data });
});
exports.patchAdminCustomerHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.updateAdminCustomer)(String(req.params.id), req.body);
    res.json({ data });
});
exports.listAdminCustomerOrdersHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.listAdminCustomerOrders)(String(req.params.id));
    res.json({ data });
});
exports.getMeProfileHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.getMeProfile)(currentCustomerId(req));
    res.json({ data });
});
exports.patchMeProfileHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.patchMeProfile)(currentCustomerId(req), req.body);
    res.json({ data });
});
exports.listMeAddressesHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.listMeAddresses)(currentCustomerId(req));
    res.json({ data });
});
exports.createMeAddressHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.createMeAddress)(currentCustomerId(req), req.body);
    res.status(201).json({ data });
});
exports.patchMeAddressHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.updateMeAddress)(currentCustomerId(req), String(req.params.id), req.body);
    res.json({ data });
});
exports.deleteMeAddressHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    await (0, customers_service_1.deleteMeAddress)(currentCustomerId(req), String(req.params.id));
    res.json({ data: { success: true } });
});
exports.listMeFavoritesHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.listMeFavorites)(currentCustomerId(req));
    res.json({ data });
});
exports.createMeFavoriteHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, customers_service_1.addMeFavorite)(currentCustomerId(req), req.body.productId);
    res.status(201).json({ data });
});
exports.deleteMeFavoriteHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    await (0, customers_service_1.removeMeFavorite)(currentCustomerId(req), String(req.params.productId));
    res.json({ data: { success: true } });
});
