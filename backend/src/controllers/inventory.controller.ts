import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  adjustInventory,
  getInventorySummary,
  listInventoryItems,
  listInventoryMovements,
} from "../services/inventory.service";

export const listInventoryItemsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));

  const result = await listInventoryItems({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    category: String(req.query.category || "").trim() || undefined,
    lowStockOnly: String(req.query.lowStockOnly || "false") === "true",
  });

  res.json(result);
});

export const inventorySummaryHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getInventorySummary();
  res.json({ data });
});

export const createInventoryAdjustmentHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await adjustInventory({
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

export const listInventoryMovementsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));

  const result = await listInventoryMovements({
    page,
    limit,
    productId: String(req.query.productId || "").trim() || undefined,
  });

  res.json(result);
});
