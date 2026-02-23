"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInventoryItems = listInventoryItems;
exports.getInventorySummary = getInventorySummary;
exports.adjustInventory = adjustInventory;
exports.listInventoryMovements = listInventoryMovements;
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
const products_service_1 = require("./products.service");
function canonicalCategory(value) {
    const key = String(value || "").trim().toLocaleLowerCase("pt-BR");
    if (key === "acessorios" || key === "acess�rios")
        return "casual";
    return key || "outros";
}
function normalizeSizes(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((raw) => {
        if (!raw || typeof raw !== "object")
            return null;
        const row = raw;
        const label = String(row.label || "").trim();
        if (!label)
            return null;
        return {
            label,
            stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
            sku: row.sku ? String(row.sku) : undefined,
            active: row.active === undefined ? true : Boolean(row.active),
        };
    })
        .filter((row) => row !== null);
}
function toInventoryItem(product) {
    const sizes = normalizeSizes(product.sizes);
    const sizeType = product.sizeType || (sizes.length ? "custom" : "unico");
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
        price: (0, money_1.fromCents)(product.priceCents),
        updatedAt: product.updatedAt?.toISOString(),
        tags: product.tags,
        active: product.active,
    };
}
function toMovement(row) {
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
async function listInventoryItems(input) {
    const where = {};
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
        }
        else {
            where.category = input.category;
        }
    }
    if (input.lowStockOnly)
        where.stock = { lte: 5 };
    const [rows, total] = await Promise.all([
        prisma_1.prisma.product.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.product.count({ where }),
    ]);
    return {
        data: rows.map(toInventoryItem),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getInventorySummary() {
    const [total, lowStock, outOfStock] = await Promise.all([
        prisma_1.prisma.product.count(),
        prisma_1.prisma.product.count({ where: { stock: { lte: 5 } } }),
        prisma_1.prisma.product.count({ where: { stock: { lte: 0 } } }),
    ]);
    return { total, lowStock, outOfStock };
}
async function adjustInventory(input) {
    const product = await prisma_1.prisma.product.findUnique({ where: { id: input.productId } });
    if (!product)
        throw new apiError_1.ApiError(404, "Produto n�o encontrado.");
    const qty = Math.abs(Math.floor(input.quantity));
    let delta = qty;
    if (input.type === "saida" || input.type === "reserva")
        delta = -qty;
    if (input.type === "ajuste")
        delta = Math.floor(input.quantity);
    const sizes = normalizeSizes(product.sizes);
    const sizeType = product.sizeType || (sizes.length ? "custom" : "unico");
    const hasSizes = sizeType !== "unico" && sizes.length > 0;
    let nextStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));
    let nextSizes = sizes;
    if (input.sizeLabel && !hasSizes) {
        throw new apiError_1.ApiError(400, "Este produto n�o possui estoque por tamanho.");
    }
    if (hasSizes) {
        const rawLabel = String(input.sizeLabel || "").trim();
        if (!rawLabel)
            throw new apiError_1.ApiError(400, "Informe o tamanho para ajustar o estoque.");
        const normalized = rawLabel.toLocaleLowerCase("pt-BR");
        const idx = nextSizes.findIndex((row) => row.label.toLocaleLowerCase("pt-BR") === normalized);
        if (idx === -1)
            throw new apiError_1.ApiError(400, "Tamanho inv�lido para este produto.");
        const current = Math.max(0, Math.floor(Number(nextSizes[idx]?.stock ?? 0)));
        const next = current + delta;
        if (next < 0)
            throw new apiError_1.ApiError(400, "Estoque insuficiente para este tamanho.");
        nextSizes[idx] = { ...nextSizes[idx], stock: next };
        nextStock = nextSizes.reduce((acc, row) => acc + (row.active === false ? 0 : Math.max(0, row.stock)), 0);
    }
    else {
        const updatedStock = nextStock + delta;
        if (updatedStock < 0)
            throw new apiError_1.ApiError(400, "Estoque insuficiente para esta opera��o.");
        nextStock = updatedStock;
    }
    const { updatedProduct, movement } = await prisma_1.prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
            where: { id: product.id },
            data: {
                stock: nextStock,
                sizes: nextSizes,
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
    await (0, products_service_1.invalidateProductCacheByIdentity)({
        id: updatedProduct.id,
        slug: String(updatedProduct.slug || ""),
    });
    return {
        product: toInventoryItem(updatedProduct),
        movement: toMovement(movement),
    };
}
async function listInventoryMovements(input) {
    const where = {};
    if (input.productId)
        where.productId = input.productId;
    const [rows, total] = await Promise.all([
        prisma_1.prisma.inventoryMovement.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.inventoryMovement.count({ where }),
    ]);
    return {
        data: rows.map(toMovement),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
