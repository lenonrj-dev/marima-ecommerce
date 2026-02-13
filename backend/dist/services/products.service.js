"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminProducts = listAdminProducts;
exports.getAdminProductById = getAdminProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.toggleProductActivation = toggleProductActivation;
exports.listStoreProducts = listStoreProducts;
exports.getStoreProductBySlug = getStoreProductBySlug;
exports.getStoreProductVariantsBySlug = getStoreProductVariantsBySlug;
exports.listLowStockProducts = listLowStockProducts;
exports.getProductByIdOrFail = getProductByIdOrFail;
exports.deleteProduct = deleteProduct;
const Product_1 = require("../models/Product");
const Favorite_1 = require("../models/Favorite");
const apiError_1 = require("../utils/apiError");
const colorVariants_1 = require("../utils/colorVariants");
const money_1 = require("../utils/money");
const slug_1 = require("../utils/slug");
const pagination_1 = require("../utils/pagination");
function statusToBadge(status) {
    if (status === "novo")
        return "Novo";
    if (status === "destaque")
        return "Destaque";
    if (status === "oferta")
        return "Oferta";
    return undefined;
}
function canonicalCategory(value) {
    const key = String(value || "").trim().toLocaleLowerCase("pt-BR");
    if (key === "acessorios" || key === "acessórios")
        return "casual";
    return key || "outros";
}
function normalizeSizes(input) {
    if (!Array.isArray(input))
        return [];
    const seen = new Set();
    const rows = [];
    for (const raw of input) {
        if (!raw || typeof raw !== "object")
            continue;
        const item = raw;
        const label = typeof item.label === "string" ? item.label.trim() : "";
        if (!label)
            continue;
        const key = label.toLocaleLowerCase("pt-BR");
        if (seen.has(key))
            continue;
        const stock = Math.max(0, Math.floor(Number(item.stock ?? 0)));
        const sku = typeof item.sku === "string" && item.sku.trim() ? item.sku.trim().toUpperCase() : undefined;
        const active = item.active === undefined ? true : Boolean(item.active);
        rows.push({ label, stock, sku, active });
        seen.add(key);
    }
    return rows;
}
function sumActiveSizeStock(sizes) {
    return sizes.reduce((acc, item) => acc + (item.active === false ? 0 : Math.max(0, Math.floor(item.stock))), 0);
}
function inferSizeType(product) {
    const explicit = product.sizeType;
    if (explicit === "roupas" || explicit === "numerico" || explicit === "unico" || explicit === "custom") {
        return explicit;
    }
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    return hasSizes ? "custom" : "unico";
}
function toAdmin(product) {
    const sizeType = inferSizeType(product);
    const sizes = normalizeSizes(product.sizes);
    const totalStock = sizes.length ? sumActiveSizeStock(sizes) : product.stock;
    return {
        id: String(product._id),
        name: product.name,
        sku: product.sku,
        groupKey: product.groupKey || undefined,
        colorName: product.colorName || undefined,
        colorHex: product.colorHex || undefined,
        category: canonicalCategory(product.category),
        size: product.size,
        sizeType,
        sizes,
        stock: Math.max(0, Math.floor(Number(totalStock ?? 0))),
        price: (0, money_1.fromCents)(product.priceCents),
        compareAtPrice: product.compareAtPriceCents ? (0, money_1.fromCents)(product.compareAtPriceCents) : undefined,
        shortDescription: product.shortDescription,
        description: product.description,
        tags: product.tags,
        status: product.status,
        active: product.active,
        images: product.images,
        updatedAt: product.updatedAt?.toISOString(),
        slug: product.slug,
        createdAt: product.createdAt?.toISOString(),
    };
}
function toStore(product) {
    const sizeType = inferSizeType(product);
    const sizes = normalizeSizes(product.sizes).filter((row) => row.active !== false);
    const sizesDetailed = sizeType !== "unico" && sizes.length ? sizes.map((row) => ({ label: row.label, stock: row.stock })) : [];
    const totalStock = sizesDetailed.length ? sizesDetailed.reduce((acc, row) => acc + Math.max(0, Math.floor(row.stock)), 0) : product.stock;
    const gallery = (product.images || []).map((src, index) => ({ src, alt: `${product.name} ${index + 1}` }));
    return {
        id: String(product._id),
        slug: product.slug,
        title: product.name,
        price: (0, money_1.fromCents)(product.priceCents),
        compareAtPrice: product.compareAtPriceCents ? (0, money_1.fromCents)(product.compareAtPriceCents) : undefined,
        image: product.images?.[0] || "",
        category: canonicalCategory(product.category),
        groupKey: product.groupKey || undefined,
        colorName: product.colorName || undefined,
        colorHex: product.colorHex || undefined,
        tags: product.tags || [],
        stock: Math.max(0, Math.floor(Number(totalStock ?? 0))),
        variants: [],
        badge: statusToBadge(product.status),
        description: product.shortDescription,
        longDescription: product.description,
        rating: 4.7,
        reviewCount: 0,
        colors: [
            { name: "Preto", hex: "#111111" },
            { name: "Grafite", hex: "#3f3f46" },
        ],
        sizeType,
        sizes: sizesDetailed.map((row) => row.label),
        sizesDetailed,
        gallery,
        reviews: [],
    };
}
async function listAdminProducts(input) {
    const query = {};
    if (input.q) {
        query.$or = [
            { name: { $regex: input.q, $options: "i" } },
            { sku: { $regex: input.q, $options: "i" } },
            { shortDescription: { $regex: input.q, $options: "i" } },
            { tags: { $elemMatch: { $regex: input.q, $options: "i" } } },
        ];
    }
    if (input.category) {
        const key = canonicalCategory(input.category);
        if (key === "casual") {
            query.category = { $in: ["casual", "acessorios"] };
        }
        else {
            query.category = input.category;
        }
    }
    if (input.groupKey) {
        query.groupKey = (0, slug_1.slugify)(String(input.groupKey || "").trim());
    }
    if (input.status && input.status !== "all")
        query.status = input.status;
    if (typeof input.active === "boolean")
        query.active = input.active;
    const sort = input.sort || "-updatedAt";
    const [rows, total] = await Promise.all([
        Product_1.ProductModel.find(query)
            .sort(sort)
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Product_1.ProductModel.countDocuments(query),
    ]);
    return {
        data: rows.map(toAdmin),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getAdminProductById(id) {
    const product = await Product_1.ProductModel.findById(id);
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    return toAdmin(product);
}
async function createProduct(input) {
    const sku = input.sku.trim().toUpperCase();
    const exists = await Product_1.ProductModel.findOne({ sku });
    if (exists)
        throw new apiError_1.ApiError(409, "SKU já existente.");
    const slug = (0, slug_1.slugify)(`${input.name}-${sku}`);
    const normalizedSizes = normalizeSizes(input.sizes);
    const explicitSizeType = input.sizeType;
    const nextSizeType = explicitSizeType === "roupas" || explicitSizeType === "numerico" || explicitSizeType === "unico" || explicitSizeType === "custom"
        ? explicitSizeType
        : normalizedSizes.length
            ? "custom"
            : "unico";
    if (nextSizeType !== "unico" && !normalizedSizes.length) {
        throw new apiError_1.ApiError(400, "Informe ao menos um tamanho.");
    }
    const usesSizes = nextSizeType !== "unico" && normalizedSizes.length > 0;
    const totalStock = usesSizes ? sumActiveSizeStock(normalizedSizes) : Math.max(0, Math.floor(input.stock));
    const sizeText = usesSizes ? normalizedSizes.map((row) => row.label).join(", ") : input.size?.trim() || undefined;
    const normalizedColors = (0, colorVariants_1.normalizeColorVariantInput)({
        groupKey: input.groupKey,
        colorName: input.colorName,
        colorHex: input.colorHex,
        productName: input.name,
        category: input.category,
    });
    const created = await Product_1.ProductModel.create({
        name: input.name.trim(),
        slug,
        sku,
        groupKey: normalizedColors.groupKey,
        colorName: normalizedColors.colorName,
        colorHex: normalizedColors.colorHex,
        category: canonicalCategory(input.category),
        size: sizeText,
        sizeType: nextSizeType,
        sizes: usesSizes ? normalizedSizes : [],
        stock: totalStock,
        priceCents: (0, money_1.toCents)(input.price),
        compareAtPriceCents: input.compareAtPrice !== undefined && input.compareAtPrice > 0 ? (0, money_1.toCents)(input.compareAtPrice) : undefined,
        shortDescription: input.shortDescription.trim(),
        description: input.description.trim(),
        tags: input.tags || [],
        status: input.status,
        active: input.active,
        images: input.images,
    });
    return toAdmin(created);
}
async function updateProduct(id, input) {
    const product = await Product_1.ProductModel.findById(id);
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    if (input.name !== undefined)
        product.name = input.name.trim();
    if (input.sku !== undefined)
        product.sku = input.sku.trim().toUpperCase();
    if (input.category !== undefined)
        product.category = canonicalCategory(input.category);
    const normalizedColors = (0, colorVariants_1.normalizeColorVariantInput)({
        groupKey: input.groupKey,
        colorName: input.colorName,
        colorHex: input.colorHex,
        productName: product.name,
        category: product.category,
    });
    if (input.groupKey !== undefined)
        product.groupKey = normalizedColors.groupKey;
    if (input.colorName !== undefined)
        product.colorName = normalizedColors.colorName;
    if (input.colorHex !== undefined)
        product.colorHex = normalizedColors.colorHex;
    if (input.groupKey === undefined &&
        input.colorName === undefined &&
        input.colorHex === undefined &&
        !product.groupKey &&
        !product.colorName &&
        normalizedColors.inferred?.groupKey &&
        normalizedColors.inferred?.colorName) {
        product.groupKey = normalizedColors.inferred.groupKey;
        product.colorName = normalizedColors.inferred.colorName;
        product.colorHex = normalizedColors.inferred.colorHex;
    }
    const explicitSizeType = input.sizeType;
    const sizesInput = input.sizes !== undefined ? normalizeSizes(input.sizes) : undefined;
    if (explicitSizeType !== undefined) {
        if (explicitSizeType !== "roupas" && explicitSizeType !== "numerico" && explicitSizeType !== "unico" && explicitSizeType !== "custom") {
            throw new apiError_1.ApiError(400, "Tipo de tamanho inválido.");
        }
        product.sizeType = explicitSizeType;
        if (explicitSizeType === "unico") {
            product.sizes = [];
        }
    }
    if (sizesInput !== undefined) {
        if (explicitSizeType === "unico" && sizesInput.length > 0) {
            throw new apiError_1.ApiError(400, "Tipo de tamanho \"Único\" não aceita estoque por tamanho.");
        }
        if (sizesInput.length === 0) {
            product.sizeType = "unico";
            product.sizes = [];
        }
        else {
            product.sizes = sizesInput;
            if (inferSizeType(product) === "unico") {
                product.sizeType = "custom";
            }
        }
    }
    const finalSizeType = inferSizeType(product);
    if (finalSizeType !== "unico") {
        const normalizedSizes = normalizeSizes(product.sizes);
        if (!normalizedSizes.length)
            throw new apiError_1.ApiError(400, "Informe ao menos um tamanho.");
        product.sizes = normalizedSizes;
        product.size = normalizedSizes.map((row) => row.label).join(", ");
        product.stock = sumActiveSizeStock(normalizedSizes);
    }
    else {
        if (input.size !== undefined)
            product.size = input.size?.trim() || undefined;
        if (input.stock !== undefined)
            product.stock = Math.max(0, Math.floor(input.stock));
    }
    if (input.price !== undefined)
        product.priceCents = (0, money_1.toCents)(input.price);
    if (input.compareAtPrice !== undefined) {
        product.compareAtPriceCents = input.compareAtPrice > 0 ? (0, money_1.toCents)(input.compareAtPrice) : undefined;
    }
    if (input.shortDescription !== undefined)
        product.shortDescription = input.shortDescription.trim();
    if (input.description !== undefined)
        product.description = input.description.trim();
    if (input.tags !== undefined)
        product.tags = input.tags;
    if (input.status !== undefined)
        product.status = input.status;
    if (input.active !== undefined)
        product.active = input.active;
    if (input.images !== undefined)
        product.images = input.images;
    product.slug = (0, slug_1.slugify)(`${product.name}-${product.sku}`);
    await product.save();
    return toAdmin(product);
}
async function toggleProductActivation(id, active) {
    const product = await Product_1.ProductModel.findById(id);
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    product.active = active;
    await product.save();
    return toAdmin(product);
}
async function listStoreProducts(input) {
    const query = {};
    if (input.q) {
        query.$or = [
            { name: { $regex: input.q, $options: "i" } },
            { category: { $regex: input.q, $options: "i" } },
            { tags: { $elemMatch: { $regex: input.q, $options: "i" } } },
        ];
    }
    if (input.category) {
        const key = canonicalCategory(input.category);
        if (key === "casual") {
            query.category = { $in: ["casual", "acessorios"] };
        }
        else {
            query.category = canonicalCategory(input.category);
        }
    }
    if (input.status && input.status !== "all")
        query.status = input.status;
    query.active = input.active ?? true;
    query.stock = { $gt: 0 };
    if (input.maxPrice && Number.isFinite(input.maxPrice)) {
        query.priceCents = { $lte: (0, money_1.toCents)(input.maxPrice) };
    }
    let sort = { createdAt: -1, _id: -1 };
    if (input.sort === "price_asc")
        sort = { priceCents: 1, _id: 1 };
    if (input.sort === "price_desc")
        sort = { priceCents: -1, _id: -1 };
    if (input.sort === "newest")
        sort = { createdAt: -1, _id: -1 };
    const page = Math.max(1, Math.floor(input.page || 1));
    const limit = Math.max(1, Math.min(100, Math.floor(input.limit || 20)));
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
        Product_1.ProductModel.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Product_1.ProductModel.countDocuments(query),
    ]);
    const base = rows.map(toStore);
    if (!input.includeVariants) {
        return {
            data: base,
            meta: (0, pagination_1.buildMeta)(total, page, limit),
        };
    }
    const groupKeys = Array.from(new Set(rows
        .map((row) => (typeof row.groupKey === "string" ? row.groupKey.trim() : ""))
        .filter(Boolean)));
    if (groupKeys.length === 0) {
        return {
            data: base.map((item) => ({ ...item, colorVariants: [] })),
            meta: (0, pagination_1.buildMeta)(total, page, limit),
        };
    }
    const variantDocs = await Product_1.ProductModel.find({ groupKey: { $in: groupKeys } }, { _id: 1, groupKey: 1, slug: 1, colorName: 1, colorHex: 1, active: 1, stock: 1 }).sort({ groupKey: 1, colorName: 1, slug: 1 });
    const variantsByGroup = new Map();
    for (const doc of variantDocs) {
        const groupKey = typeof doc.groupKey === "string" ? doc.groupKey.trim() : "";
        if (!groupKey)
            continue;
        const mapped = {
            id: String(doc._id),
            slug: doc.slug,
            colorName: doc.colorName || undefined,
            colorHex: doc.colorHex || undefined,
            isAvailable: Boolean(doc.active) && Number(doc.stock || 0) > 0,
        };
        const list = variantsByGroup.get(groupKey) ?? [];
        list.push(mapped);
        variantsByGroup.set(groupKey, list);
    }
    return {
        data: base.map((product, index) => {
            const groupKey = typeof rows[index]?.groupKey === "string" ? rows[index].groupKey.trim() : "";
            const full = groupKey ? variantsByGroup.get(groupKey) ?? [] : [];
            let limited = full.slice(0, 6);
            const current = product.slug ? full.find((item) => item.slug === product.slug) : undefined;
            if (current && !limited.some((item) => item.slug === current.slug)) {
                limited = [...limited.slice(0, 5), current];
            }
            const unique = Array.from(new Map(limited.map((item) => [item.slug, item])).values());
            return {
                ...product,
                colorVariants: unique,
            };
        }),
        meta: (0, pagination_1.buildMeta)(total, page, limit),
    };
}
async function getStoreProductBySlug(slug) {
    const product = await Product_1.ProductModel.findOne({ slug, active: true, stock: { $gt: 0 } });
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    return toStore(product);
}
async function getStoreProductVariantsBySlug(slug) {
    const product = await Product_1.ProductModel.findOne({ slug, active: true, stock: { $gt: 0 } });
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    const groupKey = typeof product.groupKey === "string" ? product.groupKey.trim() : "";
    if (!groupKey) {
        return {
            groupKey: "",
            current: {
                id: String(product._id),
                slug: product.slug,
                colorName: product.colorName || undefined,
                colorHex: product.colorHex || undefined,
                active: Boolean(product.active),
                totalStock: Math.max(0, Math.floor(Number(product.stock ?? 0))),
                isAvailable: Boolean(product.active) && Number(product.stock || 0) > 0,
            },
            variants: [],
        };
    }
    const variants = await Product_1.ProductModel.find({ groupKey }).sort({ colorName: 1, slug: 1 });
    const current = variants.find((item) => item.slug === product.slug) ?? product;
    const mapped = variants.map((variant) => ({
        id: String(variant._id),
        slug: variant.slug,
        colorName: variant.colorName || undefined,
        colorHex: variant.colorHex || undefined,
        active: Boolean(variant.active),
        totalStock: Math.max(0, Math.floor(Number(variant.stock ?? 0))),
        isAvailable: Boolean(variant.active) && Number(variant.stock || 0) > 0,
    }));
    return {
        groupKey,
        current: {
            id: String(current._id),
            slug: current.slug,
            colorName: current.colorName || undefined,
            colorHex: current.colorHex || undefined,
            active: Boolean(current.active),
            totalStock: Math.max(0, Math.floor(Number(current.stock ?? 0))),
            isAvailable: Boolean(current.active) && Number(current.stock || 0) > 0,
        },
        variants: mapped,
    };
}
async function listLowStockProducts(limit = 10) {
    const rows = await Product_1.ProductModel.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(limit);
    return rows.map(toAdmin);
}
async function getProductByIdOrFail(id) {
    const product = await Product_1.ProductModel.findById(id);
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    return product;
}
async function deleteProduct(id) {
    const product = await Product_1.ProductModel.findById(id);
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    await Promise.all([Favorite_1.FavoriteModel.deleteMany({ productId: product._id })]);
    await product.deleteOne();
    return { success: true };
}
