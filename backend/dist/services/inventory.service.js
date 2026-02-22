"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInventoryItems = listInventoryItems;
exports.getInventorySummary = getInventorySummary;
exports.adjustInventory = adjustInventory;
exports.listInventoryMovements = listInventoryMovements;
const InventoryMovement_1 = require("../models/InventoryMovement");
const Product_1 = require("../models/Product");
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
function toInventoryItem(product) {
    const sizes = Array.isArray(product.sizes)
        ? product.sizes.map((row) => ({
            label: String(row.label || "").trim(),
            stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
            sku: row.sku ? String(row.sku) : undefined,
            active: row.active === undefined ? true : Boolean(row.active),
        }))
        : [];
    const sizeType = product.sizeType || (sizes.length ? "custom" : "unico");
    const totalStock = sizes.length
        ? sizes.reduce((acc, row) => acc + (row.active === false ? 0 : Math.max(0, Math.floor(row.stock))), 0)
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
        price: (0, money_1.fromCents)(product.priceCents),
        updatedAt: product.updatedAt?.toISOString(),
        tags: product.tags,
        active: product.active,
    };
}
function toMovement(row) {
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
async function listInventoryItems(input) {
    const query = {};
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
        }
        else {
            query.category = input.category;
        }
    }
    if (input.lowStockOnly)
        query.stock = { $lte: 5 };
    const [rows, total] = await Promise.all([
        Product_1.ProductModel.find(query)
            .sort({ updatedAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Product_1.ProductModel.countDocuments(query),
    ]);
    return {
        data: rows.map(toInventoryItem),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getInventorySummary() {
    const [total, lowStock, outOfStock] = await Promise.all([
        Product_1.ProductModel.countDocuments(),
        Product_1.ProductModel.countDocuments({ stock: { $lte: 5 } }),
        Product_1.ProductModel.countDocuments({ stock: { $lte: 0 } }),
    ]);
    return { total, lowStock, outOfStock };
}
async function adjustInventory(input) {
    const product = await Product_1.ProductModel.findById(input.productId);
    if (!product)
        throw new apiError_1.ApiError(404, "Produto n�o encontrado.");
    const qty = Math.abs(Math.floor(input.quantity));
    let delta = qty;
    if (input.type === "saida" || input.type === "reserva") {
        delta = -qty;
    }
    if (input.type === "ajuste") {
        delta = Math.floor(input.quantity);
    }
    const sizeType = product.sizeType || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
    const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;
    if (input.sizeLabel && !hasSizes) {
        throw new apiError_1.ApiError(400, "Este produto n�o possui estoque por tamanho.");
    }
    if (hasSizes) {
        const rawLabel = String(input.sizeLabel || "").trim();
        if (!rawLabel)
            throw new apiError_1.ApiError(400, "Informe o tamanho para ajustar o estoque.");
        const normalized = rawLabel.toLocaleLowerCase("pt-BR");
        const idx = product.sizes.findIndex((row) => String(row.label || "").trim().toLocaleLowerCase("pt-BR") === normalized);
        if (idx === -1)
            throw new apiError_1.ApiError(400, "Tamanho inv�lido para este produto.");
        const current = Math.max(0, Math.floor(Number(product.sizes[idx]?.stock ?? 0)));
        const next = current + delta;
        if (next < 0)
            throw new apiError_1.ApiError(400, "Estoque insuficiente para este tamanho.");
        product.sizes[idx].stock = next;
        product.stock = product.sizes.reduce((acc, row) => {
            const isActive = row?.active === undefined ? true : Boolean(row.active);
            const value = Math.max(0, Math.floor(Number(row?.stock ?? 0)));
            return acc + (isActive ? value : 0);
        }, 0);
    }
    else {
        const nextStock = product.stock + delta;
        if (nextStock < 0)
            throw new apiError_1.ApiError(400, "Estoque insuficiente para esta opera��o.");
        product.stock = nextStock;
    }
    await product.save();
    await (0, products_service_1.invalidateProductCacheByIdentity)({
        id: String(product._id),
        slug: String(product.slug || ""),
    });
    const movement = await InventoryMovement_1.InventoryMovementModel.create({
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
async function listInventoryMovements(input) {
    const query = {};
    if (input.productId)
        query.productId = input.productId;
    const [rows, total] = await Promise.all([
        InventoryMovement_1.InventoryMovementModel.find(query)
            .sort({ createdAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        InventoryMovement_1.InventoryMovementModel.countDocuments(query),
    ]);
    return {
        data: rows.map(toMovement),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
