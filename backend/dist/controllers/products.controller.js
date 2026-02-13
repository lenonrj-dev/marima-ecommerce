"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreProductVariantsHandler = exports.getStoreProductBySlugHandler = exports.listStoreProductsHandler = exports.deleteProductHandler = exports.patchProductActivationHandler = exports.patchProductHandler = exports.getAdminProductByIdHandler = exports.createProductHandler = exports.listAdminProductsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const products_service_1 = require("../services/products.service");
exports.listAdminProductsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, products_service_1.listAdminProducts)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        category: String(req.query.category || "").trim() || undefined,
        groupKey: String(req.query.groupKey || "").trim() || undefined,
        status: String(req.query.status || "").trim() || undefined,
        active: req.query.active === undefined
            ? undefined
            : String(req.query.active) === "true"
                ? true
                : String(req.query.active) === "false"
                    ? false
                    : undefined,
        sort: String(req.query.sort || "").trim() || undefined,
    });
    res.json(result);
});
exports.createProductHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const created = await (0, products_service_1.createProduct)(req.body);
    res.status(201).json({ data: created });
});
exports.getAdminProductByIdHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, products_service_1.getAdminProductById)(String(req.params.id));
    res.json({ data });
});
exports.patchProductHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const updated = await (0, products_service_1.updateProduct)(String(req.params.id), req.body);
    res.json({ data: updated });
});
exports.patchProductActivationHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const updated = await (0, products_service_1.toggleProductActivation)(String(req.params.id), Boolean(req.body.active));
    res.json({ data: updated });
});
exports.deleteProductHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, products_service_1.deleteProduct)(String(req.params.id));
    res.json({ data });
});
exports.listStoreProductsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const includeVariants = req.query.includeVariants === undefined
        ? false
        : String(req.query.includeVariants) === "true";
    const result = await (0, products_service_1.listStoreProducts)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        category: String(req.query.category || "").trim() || undefined,
        status: String(req.query.status || "").trim() || undefined,
        active: req.query.active === undefined
            ? true
            : String(req.query.active) === "true"
                ? true
                : String(req.query.active) === "false"
                    ? false
                    : true,
        sort: String(req.query.sort || "").trim() || undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        includeVariants,
    });
    res.json(result);
});
exports.getStoreProductBySlugHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, products_service_1.getStoreProductBySlug)(String(req.params.slug));
    res.json({ data });
});
exports.getStoreProductVariantsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, products_service_1.getStoreProductVariantsBySlug)(String(req.params.slug));
    res.json({ data });
});
