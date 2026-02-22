"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminReviewHandler = exports.patchAdminReviewStatusHandler = exports.listAdminReviewsHandler = exports.listMeReviewsHandler = exports.createMeReviewHandler = exports.getStoreProductReviewsSummaryHandler = exports.listStoreProductReviewsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const reviews_service_1 = require("../services/reviews.service");
exports.listStoreProductReviewsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const result = await (0, reviews_service_1.listPublishedProductReviews)({
        productId: String(req.params.productId || ""),
        page,
        limit,
        sort: String(req.query.sort || ""),
    });
    res.json(result);
});
exports.getStoreProductReviewsSummaryHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const result = await (0, reviews_service_1.getProductReviewSummary)(String(req.params.productId || ""));
    res.json({ data: result.summary });
});
exports.createMeReviewHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, reviews_service_1.createMeReview)(req.auth.sub, {
        productId: String(req.body.productId || ""),
        rating: Number(req.body.rating || 0),
        comment: String(req.body.comment || ""),
    });
    res.status(201).json({ data });
});
exports.listMeReviewsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, reviews_service_1.listMeReviews)(req.auth.sub, { page, limit });
    res.json(result);
});
exports.listAdminReviewsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, reviews_service_1.listAdminReviews)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        productId: String(req.query.productId || "").trim() || undefined,
        status: (String(req.query.status || "").trim() || "all"),
    });
    res.json(result);
});
exports.patchAdminReviewStatusHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, reviews_service_1.patchAdminReviewStatus)(String(req.params.id || ""), req.body.status);
    res.json({ data });
});
exports.deleteAdminReviewHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    await (0, reviews_service_1.deleteAdminReview)(String(req.params.id || ""));
    res.status(204).send();
});
