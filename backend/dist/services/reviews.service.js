"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviewSummary = getProductReviewSummary;
exports.listPublishedProductReviews = listPublishedProductReviews;
exports.createMeReview = createMeReview;
exports.listAdminReviews = listAdminReviews;
exports.listMeReviews = listMeReviews;
exports.patchAdminReviewStatus = patchAdminReviewStatus;
exports.deleteAdminReview = deleteAdminReview;
const dbCompat_1 = require("../lib/dbCompat");
const Customer_1 = require("../models/Customer");
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const Review_1 = require("../models/Review");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const products_service_1 = require("./products.service");
function toObjectId(value) {
    if (!dbCompat_1.Types.ObjectId.isValid(value))
        throw new apiError_1.ApiError(400, "Identificador invalido.");
    return new dbCompat_1.Types.ObjectId(value);
}
async function resolveProductIdentity(input) {
    const raw = String(input || "").trim();
    if (!raw)
        throw new apiError_1.ApiError(400, "Produto invalido.");
    const byId = dbCompat_1.Types.ObjectId.isValid(raw)
        ? await Product_1.ProductModel.findById(raw).select("_id slug name")
        : null;
    const product = byId || (await Product_1.ProductModel.findOne({ slug: raw }).select("_id slug name"));
    if (!product)
        throw new apiError_1.ApiError(404, "Produto nao encontrado.");
    return {
        id: String(product._id),
        slug: String(product.slug || ""),
        title: String(product.name || ""),
    };
}
function normalizeReviewSort(input) {
    const value = String(input || "").trim().toLocaleLowerCase("pt-BR");
    if (value === "oldest")
        return "oldest";
    if (value === "rating_desc")
        return "rating_desc";
    if (value === "rating_asc")
        return "rating_asc";
    return "recent";
}
function getStoreSort(sort) {
    if (sort === "oldest")
        return { createdAt: 1 };
    if (sort === "rating_desc")
        return { rating: -1, createdAt: -1 };
    if (sort === "rating_asc")
        return { rating: 1, createdAt: -1 };
    return { createdAt: -1 };
}
function toDistribution() {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}
function toStoreReviewDTO(row) {
    const customer = row.customerId;
    const customerName = String(row.customerName || customer?.name || "").trim() || "Cliente";
    return {
        id: String(row._id),
        productId: String(row.productId),
        customerName,
        rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
        comment: String(row.comment || ""),
        verifiedPurchase: Boolean(row.verifiedPurchase),
        createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    };
}
function toAdminReviewDTO(row) {
    const product = row.productId;
    const customer = row.customerId;
    return {
        id: String(row._id),
        productId: String(product?._id || row.productId || ""),
        productSlug: String(product?.slug || row.productSlug || ""),
        productTitle: String(product?.name || row.productTitle || "Produto"),
        customerId: String(customer?._id || row.customerId || ""),
        customerName: String(customer?.name || row.customerName || "").trim() || "Cliente",
        customerEmail: String(customer?.email || row.customerEmail || "").trim().toLowerCase(),
        rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
        comment: String(row.comment || ""),
        status: row.status || "published",
        verifiedPurchase: Boolean(row.verifiedPurchase),
        createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
    };
}
async function getPublishedSummaryByProductId(productId) {
    const target = toObjectId(productId);
    const [groupedByRating, totals] = await Promise.all([
        Review_1.ReviewModel.aggregate([
            { $match: { productId: target, status: "published" } },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
        ]),
        Review_1.ReviewModel.aggregate([
            { $match: { productId: target, status: "published" } },
            { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: "$rating" } } },
        ]),
    ]);
    const distribution = toDistribution();
    for (const row of groupedByRating) {
        const rating = Number(row?._id || 0);
        if (rating >= 1 && rating <= 5) {
            distribution[rating] = Math.max(0, Number(row.count || 0));
        }
    }
    const total = Number(totals?.[0]?.total || 0);
    const avgRaw = Number(totals?.[0]?.avg || 0);
    const avgRating = total > 0 ? Number(avgRaw.toFixed(1)) : 0;
    return { avgRating, total, distribution };
}
async function refreshProductReviewStats(productIdentity) {
    const summary = await getPublishedSummaryByProductId(productIdentity.id);
    await Product_1.ProductModel.updateOne({ _id: toObjectId(productIdentity.id) }, {
        reviewAverage: summary.avgRating,
        reviewCount: summary.total,
    });
    await (0, products_service_1.invalidateProductCacheByIdentity)({
        id: productIdentity.id,
        slug: productIdentity.slug,
    });
}
async function getProductReviewSummary(productInput) {
    const product = await resolveProductIdentity(productInput);
    const summary = await getPublishedSummaryByProductId(product.id);
    return {
        product,
        summary,
    };
}
async function listPublishedProductReviews(input) {
    const product = await resolveProductIdentity(input.productId);
    const sort = normalizeReviewSort(input.sort);
    const query = {
        productId: toObjectId(product.id),
        status: "published",
    };
    const [rows, total] = await Promise.all([
        Review_1.ReviewModel.find(query)
            .sort(getStoreSort(sort))
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Review_1.ReviewModel.countDocuments(query),
    ]);
    const customerIds = Array.from(new Set(rows.map((row) => String(row.customerId || "")).filter(Boolean)));
    const customerRows = customerIds.length
        ? await Customer_1.CustomerModel.find({ _id: { $in: customerIds } }).select("name")
        : [];
    const customerMap = new Map(customerRows.map((row) => [String(row._id), String(row.name || "")]));
    for (const row of rows) {
        row.customerName = customerMap.get(String(row.customerId || "")) || "Cliente";
    }
    return {
        product,
        data: rows.map((row) => toStoreReviewDTO(row)),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function createMeReview(customerId, input) {
    const product = await resolveProductIdentity(input.productId);
    const rating = Math.floor(Number(input.rating || 0));
    const comment = String(input.comment || "").trim();
    if (rating < 1 || rating > 5)
        throw new apiError_1.ApiError(400, "A nota deve estar entre 1 e 5.");
    if (comment.length < 5 || comment.length > 2000) {
        throw new apiError_1.ApiError(400, "Comentario deve ter entre 5 e 2000 caracteres.");
    }
    const customerObjectId = toObjectId(customerId);
    const productObjectId = toObjectId(product.id);
    const existing = await Review_1.ReviewModel.findOne({
        productId: productObjectId,
        customerId: customerObjectId,
    });
    if (existing) {
        throw new apiError_1.ApiError(409, "Voce ja avaliou este produto.");
    }
    const verifiedPurchase = Boolean(await Order_1.OrderModel.exists({
        customerId: customerObjectId,
        "items.productId": productObjectId,
        status: { $nin: ["cancelado", "reembolsado"] },
    }));
    const created = await Review_1.ReviewModel.create({
        productId: productObjectId,
        customerId: customerObjectId,
        rating,
        comment,
        verifiedPurchase,
        status: "published",
    });
    await refreshProductReviewStats(product);
    const customer = await Customer_1.CustomerModel.findById(customerObjectId).select("name");
    return {
        id: String(created._id),
        productId: product.id,
        customerName: String(customer?.name || "").trim() || "Cliente",
        rating: created.rating,
        comment: created.comment,
        verifiedPurchase: Boolean(created.verifiedPurchase),
        createdAt: created.createdAt?.toISOString() || new Date().toISOString(),
    };
}
async function listAdminReviews(input) {
    const query = {};
    if (input.status && input.status !== "all") {
        query.status = input.status;
    }
    if (input.productId) {
        const product = await resolveProductIdentity(input.productId);
        query.productId = toObjectId(product.id);
    }
    if (input.q) {
        const regex = new RegExp(input.q, "i");
        const [customers, products] = await Promise.all([
            Customer_1.CustomerModel.find({ $or: [{ name: regex }, { email: regex }] }).select("_id").limit(100),
            Product_1.ProductModel.find({ $or: [{ name: regex }, { slug: regex }] }).select("_id").limit(100),
        ]);
        query.$or = [
            { comment: regex },
            { customerId: { $in: customers.map((row) => row._id) } },
            { productId: { $in: products.map((row) => row._id) } },
        ];
    }
    const [rows, total] = await Promise.all([
        Review_1.ReviewModel.find(query)
            .sort({ createdAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Review_1.ReviewModel.countDocuments(query),
    ]);
    const productIds = Array.from(new Set(rows.map((row) => String(row.productId || "")).filter(Boolean)));
    const customerIds = Array.from(new Set(rows.map((row) => String(row.customerId || "")).filter(Boolean)));
    const [products, customers] = await Promise.all([
        productIds.length ? Product_1.ProductModel.find({ _id: { $in: productIds } }).select("name slug") : [],
        customerIds.length ? Customer_1.CustomerModel.find({ _id: { $in: customerIds } }).select("name email") : [],
    ]);
    const productMap = new Map(products.map((row) => [String(row._id), row]));
    const customerMap = new Map(customers.map((row) => [String(row._id), row]));
    for (const row of rows) {
        const product = productMap.get(String(row.productId || ""));
        const customer = customerMap.get(String(row.customerId || ""));
        row.productTitle = String(product?.name || "Produto");
        row.productSlug = String(product?.slug || "");
        row.customerName = String(customer?.name || "Cliente");
        row.customerEmail = String(customer?.email || "");
    }
    return {
        data: rows.map((row) => toAdminReviewDTO(row)),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function listMeReviews(customerId, input) {
    const customerObjectId = toObjectId(customerId);
    const query = { customerId: customerObjectId };
    const [rows, total] = await Promise.all([
        Review_1.ReviewModel.find(query)
            .sort({ createdAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Review_1.ReviewModel.countDocuments(query),
    ]);
    const productIds = Array.from(new Set(rows.map((row) => String(row.productId || "")).filter(Boolean)));
    const products = productIds.length ? await Product_1.ProductModel.find({ _id: { $in: productIds } }).select("name slug") : [];
    const productMap = new Map(products.map((row) => [String(row._id), row]));
    return {
        data: rows.map((row) => {
            const product = productMap.get(String(row.productId || ""));
            return {
                id: String(row._id),
                productId: String(row.productId || ""),
                productSlug: String(product?.slug || ""),
                productTitle: String(product?.name || "Produto"),
                rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
                comment: String(row.comment || ""),
                status: row.status || "published",
                verifiedPurchase: Boolean(row.verifiedPurchase),
                createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
            };
        }),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function patchAdminReviewStatus(reviewId, status) {
    if (!dbCompat_1.Types.ObjectId.isValid(reviewId))
        throw new apiError_1.ApiError(400, "Avaliacao invalida.");
    const review = await Review_1.ReviewModel.findById(reviewId);
    if (!review)
        throw new apiError_1.ApiError(404, "Avaliacao nao encontrada.");
    review.status = status;
    await review.save();
    const product = await Product_1.ProductModel.findById(String(review.productId || ""));
    if (product?._id) {
        await refreshProductReviewStats({
            id: String(product._id),
            slug: String(product.slug || ""),
            title: String(product.name || ""),
        });
    }
    const refreshed = await Review_1.ReviewModel.findById(review._id);
    if (!refreshed)
        throw new apiError_1.ApiError(404, "Avaliacao nao encontrada.");
    const [refreshedProduct, refreshedCustomer] = await Promise.all([
        Product_1.ProductModel.findById(String(refreshed.productId || "")).select("name slug"),
        Customer_1.CustomerModel.findById(String(refreshed.customerId || "")).select("name email"),
    ]);
    refreshed.productTitle = String(refreshedProduct?.name || "Produto");
    refreshed.productSlug = String(refreshedProduct?.slug || "");
    refreshed.customerName = String(refreshedCustomer?.name || "Cliente");
    refreshed.customerEmail = String(refreshedCustomer?.email || "");
    return toAdminReviewDTO(refreshed);
}
async function deleteAdminReview(reviewId) {
    if (!dbCompat_1.Types.ObjectId.isValid(reviewId))
        throw new apiError_1.ApiError(400, "Avaliacao invalida.");
    const review = await Review_1.ReviewModel.findById(reviewId);
    if (!review)
        throw new apiError_1.ApiError(404, "Avaliacao nao encontrada.");
    const product = await Product_1.ProductModel.findById(String(review.productId || ""));
    await review.deleteOne();
    if (product?._id) {
        await refreshProductReviewStats({
            id: String(product._id),
            slug: String(product.slug || ""),
            title: String(product.name || ""),
        });
    }
    return { id: reviewId };
}
