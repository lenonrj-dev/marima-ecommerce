import { FilterQuery } from "../lib/dbCompat";
import { InventoryMovementModel } from "../models/InventoryMovement";
import { ProductModel } from "../models/Product";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents } from "../utils/money";
import { invalidateProductCacheByIdentity } from "./products.service";

function canonicalCategory(value: unknown) {
  const key = String(value || "").trim().toLocaleLowerCase("pt-BR");
  if (key === "acessorios" || key === "acessórios") return "casual";
  return key || "outros";
}

function toInventoryItem(product: any) {
  const sizes = Array.isArray(product.sizes)
    ? product.sizes.map((row: any) => ({
        label: String(row.label || "").trim(),
        stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
        sku: row.sku ? String(row.sku) : undefined,
        active: row.active === undefined ? true : Boolean(row.active),
      }))
    : [];

  const sizeType = (product.sizeType as string) || (sizes.length ? "custom" : "unico");
  const totalStock = sizes.length
    ? sizes.reduce(
        (acc: number, row: { stock: number; active?: boolean }) =>
          acc + (row.active === false ? 0 : Math.max(0, Math.floor(row.stock))),
        0,
      )
    : product.stock;

  return {
    id: String(product._id),
    name: product.name,
    sku: product.sku,
    category: canonicalCategory(product.category),
    status: product.status,
    shortDescription: product.shortDescription,
    sizeType,
    sizes,
    stock: Math.max(0, Math.floor(Number(totalStock ?? 0))),
    price: fromCents(product.priceCents),
    updatedAt: product.updatedAt?.toISOString(),
    tags: product.tags,
    active: product.active,
  };
}

function toMovement(row: any) {
  return {
    id: String(row._id),
    productId: String(row.productId),
    variantId: row.variantId,
    sizeLabel: row.sizeLabel,
    type: row.type,
    quantity: row.quantity,
    reason: row.reason,
    createdBy: row.createdBy,
    note: row.note,
    createdAt: row.createdAt?.toISOString(),
  };
}

export async function listInventoryItems(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  lowStockOnly?: boolean;
}) {
  const query: FilterQuery<any> = {};

  if (input.q) {
    query.$or = [
      { name: { $regex: input.q, $options: "i" } },
      { sku: { $regex: input.q, $options: "i" } },
      { tags: { $elemMatch: { $regex: input.q, $options: "i" } } },
    ];
  }

  if (input.category && input.category !== "all") {
    const key = canonicalCategory(input.category);
    if (key === "casual") {
      query.category = { $in: ["casual", "acessorios"] };
    } else {
      query.category = input.category;
    }
  }
  if (input.lowStockOnly) query.stock = { $lte: 5 };

  const [rows, total] = await Promise.all([
    ProductModel.find(query)
      .sort({ updatedAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    ProductModel.countDocuments(query),
  ]);

  return {
    data: rows.map(toInventoryItem),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getInventorySummary() {
  const [total, lowStock, outOfStock] = await Promise.all([
    ProductModel.countDocuments(),
    ProductModel.countDocuments({ stock: { $lte: 5 } }),
    ProductModel.countDocuments({ stock: { $lte: 0 } }),
  ]);

  return { total, lowStock, outOfStock };
}

export async function adjustInventory(input: {
  productId: string;
  type: "entrada" | "saida" | "ajuste" | "reserva" | "liberacao";
  quantity: number;
  reason: string;
  sizeLabel?: string;
  createdBy?: string;
  note?: string;
}) {
  const product = await ProductModel.findById(input.productId);
  if (!product) throw new ApiError(404, "Produto não encontrado.");

  const qty = Math.abs(Math.floor(input.quantity));
  let delta = qty;

  if (input.type === "saida" || input.type === "reserva") {
    delta = -qty;
  }

  if (input.type === "ajuste") {
    delta = Math.floor(input.quantity);
  }

  const sizeType = (product.sizeType as string) || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
  const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;

  if (input.sizeLabel && !hasSizes) {
    throw new ApiError(400, "Este produto não possui estoque por tamanho.");
  }

  if (hasSizes) {
    const rawLabel = String(input.sizeLabel || "").trim();
    if (!rawLabel) throw new ApiError(400, "Informe o tamanho para ajustar o estoque.");

    const normalized = rawLabel.toLocaleLowerCase("pt-BR");
    const idx = product.sizes.findIndex((row: any) => String(row.label || "").trim().toLocaleLowerCase("pt-BR") === normalized);
    if (idx === -1) throw new ApiError(400, "Tamanho inválido para este produto.");

    const current = Math.max(0, Math.floor(Number(product.sizes[idx]?.stock ?? 0)));
    const next = current + delta;
    if (next < 0) throw new ApiError(400, "Estoque insuficiente para este tamanho.");

    product.sizes[idx]!.stock = next;
    product.stock = product.sizes.reduce((acc: number, row: any) => {
      const isActive = row?.active === undefined ? true : Boolean(row.active);
      const value = Math.max(0, Math.floor(Number(row?.stock ?? 0)));
      return acc + (isActive ? value : 0);
    }, 0);
  } else {
    const nextStock = product.stock + delta;
    if (nextStock < 0) throw new ApiError(400, "Estoque insuficiente para esta operação.");
    product.stock = nextStock;
  }

  await product.save();
  await invalidateProductCacheByIdentity({
    id: String(product._id),
    slug: String(product.slug || ""),
  });

  const movement = await InventoryMovementModel.create({
    productId: product._id,
    type: input.type,
    quantity: delta,
    reason: input.reason,
    sizeLabel: input.sizeLabel ? String(input.sizeLabel).trim() : undefined,
    createdBy: input.createdBy,
    note: input.note,
  });

  return {
    product: toInventoryItem(product),
    movement: toMovement(movement),
  };
}

export async function listInventoryMovements(input: {
  page: number;
  limit: number;
  productId?: string;
}) {
  const query: FilterQuery<any> = {};
  if (input.productId) query.productId = input.productId;

  const [rows, total] = await Promise.all([
    InventoryMovementModel.find(query)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    InventoryMovementModel.countDocuments(query),
  ]);

  return {
    data: rows.map(toMovement),
    meta: buildMeta(total, input.page, input.limit),
  };
}

