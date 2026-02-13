"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInventoryMovementsHandler = exports.createInventoryAdjustmentHandler = exports.inventorySummaryHandler = exports.listInventoryItemsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const inventory_service_1 = require("../services/inventory.service");
exports.listInventoryItemsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const result = await (0, inventory_service_1.listInventoryItems)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        category: String(req.query.category || "").trim() || undefined,
        lowStockOnly: String(req.query.lowStockOnly || "false") === "true",
    });
    res.json(result);
});
exports.inventorySummaryHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const data = await (0, inventory_service_1.getInventorySummary)();
    res.json({ data });
});
exports.createInventoryAdjustmentHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, inventory_service_1.adjustInventory)({
        productId: req.body.productId,
        type: req.body.type,
        quantity: Number(req.body.quantity),
        reason: req.body.reason,
        sizeLabel: req.body.sizeLabel,
        createdBy: req.auth?.sub,
        note: req.body.note,
    });
    res.status(201).json({ data });
});
exports.listInventoryMovementsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const result = await (0, inventory_service_1.listInventoryMovements)({
        page,
        limit,
        productId: String(req.query.productId || "").trim() || undefined,
    });
    res.json(result);
});
