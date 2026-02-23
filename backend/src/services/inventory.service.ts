import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents } from "../utils/money";
import { invalidateProductCacheByIdentity } from "./products.service";

function canonicalCategory(value: unknown) {
  const key = String(value || "").trim().toLocaleLowerCase("pt-BR");
  if (key === "acessorios" || key === "acessórios") return "casual";
  return key || "outros";
}

type SizeRow = { label: string; stock: number; sku?: string; active?: boolean };

function normalizeSizes(value: unknown): SizeRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as any;
      const label = String(row.label || "").trim();
      if (!label) return null;
      return {
        label,
        stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
        sku: row.sku ? String(row.sku) : undefined,
        active: row.active === undefined ? true : Boolean(row.active),
      } as SizeRow;
    })
    .filter((row): row is SizeRow => row !== null);
}

function toInventoryItem(product: any) {
  const sizes = normalizeSizes(product.sizes);
  const sizeType = (product.sizeType as string) || (sizes.length ? "custom" : "unico");
  const totalStock = sizes.length
    ? sizes.reduce((acc, row) => acc + (row.active === false ? 0 : Math.max(0, row.stock)), 0)
    : product.stock;

  return {
    id: String(product.id),
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
    id: String(row.id),
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
  const where: any = {};

  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { sku: { contains: input.q, mode: "insensitive" } },
    ];
  }

  if (input.category && input.category !== "all") {
    const key = canonicalCategory(input.category);
    if (key === "casual") {
      where.category = { in: ["casual", "acessorios"] };
    } else {
      where.category = input.category;
    }
  }
  if (input.lowStockOnly) where.stock = { lte: 5 };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: rows.map(toInventoryItem),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getInventorySummary() {
  const [total, lowStock, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
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
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new ApiError(404, "Produto não encontrado.");

  const qty = Math.abs(Math.floor(input.quantity));
  let delta = qty;

  if (input.type === "saida" || input.type === "reserva") delta = -qty;
  if (input.type === "ajuste") delta = Math.floor(input.quantity);

  const sizes = normalizeSizes(product.sizes);
  const sizeType = (product.sizeType as string) || (sizes.length ? "custom" : "unico");
  const hasSizes = sizeType !== "unico" && sizes.length > 0;

  let nextStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));
  let nextSizes = sizes;

  if (input.sizeLabel && !hasSizes) {
    throw new ApiError(400, "Este produto não possui estoque por tamanho.");
  }

  if (hasSizes) {
    const rawLabel = String(input.sizeLabel || "").trim();
    if (!rawLabel) throw new ApiError(400, "Informe o tamanho para ajustar o estoque.");

    const normalized = rawLabel.toLocaleLowerCase("pt-BR");
    const idx = nextSizes.findIndex((row) => row.label.toLocaleLowerCase("pt-BR") === normalized);
    if (idx === -1) throw new ApiError(400, "Tamanho inválido para este produto.");

    const current = Math.max(0, Math.floor(Number(nextSizes[idx]?.stock ?? 0)));
    const next = current + delta;
    if (next < 0) throw new ApiError(400, "Estoque insuficiente para este tamanho.");

    nextSizes[idx] = { ...nextSizes[idx]!, stock: next };
    nextStock = nextSizes.reduce((acc, row) => acc + (row.active === false ? 0 : Math.max(0, row.stock)), 0);
  } else {
    const updatedStock = nextStock + delta;
    if (updatedStock < 0) throw new ApiError(400, "Estoque insuficiente para esta operação.");
    nextStock = updatedStock;
  }

  const { updatedProduct, movement } = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: {
        stock: nextStock,
        sizes: nextSizes as any,
      },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        type: input.type,
        quantity: delta,
        reason: input.reason,
        sizeLabel: input.sizeLabel ? String(input.sizeLabel).trim() : undefined,
        createdBy: input.createdBy,
        note: input.note,
      },
    });

    return { updatedProduct, movement };
  });

  await invalidateProductCacheByIdentity({
    id: updatedProduct.id,
    slug: String(updatedProduct.slug || ""),
  });

  return {
    product: toInventoryItem(updatedProduct),
    movement: toMovement(movement),
  };
}

export async function listInventoryMovements(input: {
  page: number;
  limit: number;
  productId?: string;
}) {
  const where: any = {};
  if (input.productId) where.productId = input.productId;

  const [rows, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return {
    data: rows.map(toMovement),
    meta: buildMeta(total, input.page, input.limit),
  };
}
