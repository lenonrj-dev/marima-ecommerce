"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviewSummary = getProductReviewSummary;
exports.listPublishedProductReviews = listPublishedProductReviews;
exports.createMeReview = createMeReview;
exports.listAdminReviews = listAdminReviews;
exports.listMeReviews = listMeReviews;
exports.patchAdminReviewStatus = patchAdminReviewStatus;
exports.deleteAdminReview = deleteAdminReview;
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const products_service_1 = require("./products.service");
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
function getStoreOrderBy(sort) {
    if (sort === "oldest")
        return [{ createdAt: "asc" }];
    if (sort === "rating_desc")
        return [{ rating: "desc" }, { createdAt: "desc" }];
    if (sort === "rating_asc")
        return [{ rating: "asc" }, { createdAt: "desc" }];
    return [{ createdAt: "desc" }];
}
function toDistribution() {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}
async function resolveProductIdentity(input) {
    const raw = String(input || "").trim();
    if (!raw)
        throw new apiError_1.ApiError(400, "Produto inválido.");
    const byId = await prisma_1.prisma.product.findUnique({
        where: { id: raw },
        select: { id: true, slug: true, name: true },
    });
    const product = byId ||
        (await prisma_1.prisma.product.findUnique({
            where: { slug: raw },
            select: { id: true, slug: true, name: true },
        }));
    if (!product)
        throw new apiError_1.ApiError(404, "Produto não encontrado.");
    return {
        id: String(product.id),
        slug: String(product.slug || ""),
        title: String(product.name || ""),
    };
}
async function getPublishedSummaryByProductId(productId) {
    const [groupedByRating, totals] = await Promise.all([
        prisma_1.prisma.review.groupBy({
            by: ["rating"],
            where: { productId, status: "published" },
            _count: { _all: true },
        }),
        prisma_1.prisma.review.aggregate({
            where: { productId, status: "published" },
            _count: { _all: true },
            _avg: { rating: true },
        }),
    ]);
    const distribution = toDistribution();
    for (const row of groupedByRating) {
        const rating = Number(row.rating || 0);
        if (rating >= 1 && rating <= 5) {
            distribution[rating] = Math.max(0, Number(row._count._all || 0));
        }
    }
    const total = Number(totals._count._all || 0);
    const avgRaw = Number(totals._avg.rating || 0);
    const avgRating = total > 0 ? Number(avgRaw.toFixed(1)) : 0;
    return { avgRating, total, distribution };
}
async function refreshProductReviewStats(productIdentity) {
    const summary = await getPublishedSummaryByProductId(productIdentity.id);
    await prisma_1.prisma.product.update({
        where: { id: productIdentity.id },
        data: {
            reviewAverage: summary.avgRating,
            reviewCount: summary.total,
        },
    });
    await (0, products_service_1.invalidateProductCacheByIdentity)({
        id: productIdentity.id,
        slug: productIdentity.slug,
    });
}
async function getProductReviewSummary(productInput) {
    const product = await resolveProductIdentity(productInput);
    const summary = await getPublishedSummaryByProductId(product.id);
    return { product, summary };
}
async function listPublishedProductReviews(input) {
    const product = await resolveProductIdentity(input.productId);
    const sort = normalizeReviewSort(input.sort);
    const where = { productId: product.id, status: "published" };
    const [rows, total] = await Promise.all([
        prisma_1.prisma.review.findMany({
            where,
            include: {
                customer: {
                    select: { name: true },
                },
            },
            orderBy: getStoreOrderBy(sort),
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.review.count({ where }),
    ]);
    return {
        product,
        data: rows.map((row) => ({
            id: String(row.id),
            productId: String(row.productId),
            customerName: String(row.customer?.name || "").trim() || "Cliente",
            rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
            comment: String(row.comment || ""),
            verifiedPurchase: Boolean(row.verifiedPurchase),
            createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        })),
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
        throw new apiError_1.ApiError(400, "Comentário deve ter entre 5 e 2000 caracteres.");
    }
    const existing = await prisma_1.prisma.review.findUnique({
        where: {
            productId_customerId: {
                productId: product.id,
                customerId,
            },
        },
    });
    if (existing)
        throw new apiError_1.ApiError(409, "Você já avaliou este produto.");
    const verifiedPurchase = Boolean(await prisma_1.prisma.orderItem.findFirst({
        where: {
            productId: product.id,
            order: {
                customerId,
                status: { notIn: ["cancelado", "reembolsado"] },
            },
        },
        select: { id: true },
    }));
    let created;
    try {
        created = await prisma_1.prisma.review.create({
            data: {
                productId: product.id,
                customerId,
                rating,
                comment,
                verifiedPurchase,
                status: "published",
            },
        });
    }
    catch (error) {
        if (error?.code === "P2002")
            throw new apiError_1.ApiError(409, "Você já avaliou este produto.");
        throw error;
    }
    await refreshProductReviewStats(product);
    const customer = await prisma_1.prisma.customer.findUnique({
        where: { id: customerId },
        select: { name: true },
    });
    return {
        id: String(created.id),
        productId: product.id,
        customerName: String(customer?.name || "").trim() || "Cliente",
        rating: created.rating,
        comment: created.comment,
        verifiedPurchase: Boolean(created.verifiedPurchase),
        createdAt: created.createdAt?.toISOString() || new Date().toISOString(),
    };
}
async function listAdminReviews(input) {
    const where = {};
    if (input.status && input.status !== "all")
        where.status = input.status;
    if (input.productId) {
        const product = await resolveProductIdentity(input.productId);
        where.productId = product.id;
    }
    if (input.q) {
        where.OR = [
            { comment: { contains: input.q, mode: "insensitive" } },
            {
                customer: {
                    is: {
                        OR: [
                            { name: { contains: input.q, mode: "insensitive" } },
                            { email: { contains: input.q, mode: "insensitive" } },
                        ],
                    },
                },
            },
            {
                product: {
                    is: {
                        OR: [
                            { name: { contains: input.q, mode: "insensitive" } },
                            { slug: { contains: input.q, mode: "insensitive" } },
                        ],
                    },
                },
            },
        ];
    }
    const [rows, total] = await Promise.all([
        prisma_1.prisma.review.findMany({
            where,
            include: {
                product: { select: { id: true, slug: true, name: true } },
                customer: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.review.count({ where }),
    ]);
    return {
        data: rows.map((row) => ({
            id: String(row.id),
            productId: String(row.productId || ""),
            productSlug: String(row.product?.slug || ""),
            productTitle: String(row.product?.name || "Produto"),
            customerId: String(row.customerId || ""),
            customerName: String(row.customer?.name || "").trim() || "Cliente",
            customerEmail: String(row.customer?.email || "").trim().toLowerCase(),
            rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
            comment: String(row.comment || ""),
            status: row.status,
            verifiedPurchase: Boolean(row.verifiedPurchase),
            createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
        })),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function listMeReviews(customerId, input) {
    const where = { customerId };
    const [rows, total] = await Promise.all([
        prisma_1.prisma.review.findMany({
            where,
            include: { product: { select: { name: true, slug: true } } },
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.review.count({ where }),
    ]);
    return {
        data: rows.map((row) => ({
            id: String(row.id),
            productId: String(row.productId || ""),
            productSlug: String(row.product?.slug || ""),
            productTitle: String(row.product?.name || "Produto"),
            rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
            comment: String(row.comment || ""),
            status: row.status,
            verifiedPurchase: Boolean(row.verifiedPurchase),
            createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
        })),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function patchAdminReviewStatus(reviewId, status) {
    const review = await prisma_1.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw new apiError_1.ApiError(404, "Avaliação não encontrada.");
    await prisma_1.prisma.review.update({
        where: { id: reviewId },
        data: { status },
    });
    const product = await prisma_1.prisma.product.findUnique({
        where: { id: review.productId },
        select: { id: true, slug: true, name: true },
    });
    if (product) {
        await refreshProductReviewStats({
            id: String(product.id),
            slug: String(product.slug || ""),
            title: String(product.name || ""),
        });
    }
    const refreshed = await prisma_1.prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            product: { select: { id: true, slug: true, name: true } },
            customer: { select: { id: true, name: true, email: true } },
        },
    });
    if (!refreshed)
        throw new apiError_1.ApiError(404, "Avaliação não encontrada.");
    return {
        id: String(refreshed.id),
        productId: String(refreshed.productId || ""),
        productSlug: String(refreshed.product?.slug || ""),
        productTitle: String(refreshed.product?.name || "Produto"),
        customerId: String(refreshed.customerId || ""),
        customerName: String(refreshed.customer?.name || "").trim() || "Cliente",
        customerEmail: String(refreshed.customer?.email || "").trim().toLowerCase(),
        rating: Math.max(1, Math.min(5, Number(refreshed.rating || 0))),
        comment: String(refreshed.comment || ""),
        status: refreshed.status,
        verifiedPurchase: Boolean(refreshed.verifiedPurchase),
        createdAt: refreshed.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: refreshed.updatedAt?.toISOString() || new Date().toISOString(),
    };
}
async function deleteAdminReview(reviewId) {
    const review = await prisma_1.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw new apiError_1.ApiError(404, "Avaliação não encontrada.");
    await prisma_1.prisma.review.delete({ where: { id: reviewId } });
    const product = await prisma_1.prisma.product.findUnique({
        where: { id: review.productId },
        select: { id: true, slug: true, name: true },
    });
    if (product) {
        await refreshProductReviewStats({
            id: String(product.id),
            slug: String(product.slug || ""),
            title: String(product.name || ""),
        });
    }
    return { id: reviewId };
}
