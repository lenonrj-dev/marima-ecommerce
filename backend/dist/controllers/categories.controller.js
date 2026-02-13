"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStoreCategoriesHandler = exports.patchCategoryHandler = exports.createCategoryHandler = exports.listAdminCategoriesHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const categories_service_1 = require("../services/categories.service");
exports.listAdminCategoriesHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, categories_service_1.listCategories)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        active: req.query.active === undefined
            ? undefined
            : String(req.query.active) === "true"
                ? true
                : false,
    });
    res.json(result);
});
exports.createCategoryHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, categories_service_1.createCategory)(req.body);
    res.status(201).json({ data });
});
exports.patchCategoryHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, categories_service_1.updateCategory)(String(req.params.id), req.body);
    res.json({ data });
});
exports.listStoreCategoriesHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const data = await (0, categories_service_1.listStoreCategories)();
    res.json({ data });
});
