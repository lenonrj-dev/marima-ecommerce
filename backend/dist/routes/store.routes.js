"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const categories_controller_1 = require("../controllers/categories.controller");
const orders_controller_1 = require("../controllers/orders.controller");
const products_controller_1 = require("../controllers/products.controller");
const reviews_controller_1 = require("../controllers/reviews.controller");
const coupons_controller_1 = require("../controllers/coupons.controller");
const cashback_controller_1 = require("../controllers/cashback.controller");
const support_controller_1 = require("../controllers/support.controller");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
router.get("/categories", categories_controller_1.listStoreCategoriesHandler);
router.get("/products", products_controller_1.listStoreProductsHandler);
router.get("/products/:productId/reviews", (0, validate_1.validate)({
    params: zod_1.z.object({
        productId: zod_1.z.string().min(1),
    }),
    query: zod_1.z
        .object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        sort: zod_1.z.enum(["recent", "oldest", "rating_desc", "rating_asc"]).optional(),
    })
        .optional(),
}), reviews_controller_1.listStoreProductReviewsHandler);
router.get("/products/:productId/reviews/summary", (0, validate_1.validate)({
    params: zod_1.z.object({
        productId: zod_1.z.string().min(1),
    }),
}), reviews_controller_1.getStoreProductReviewsSummaryHandler);
router.get("/products/:slug/variants", products_controller_1.getStoreProductVariantsHandler);
router.get("/products/:slug", products_controller_1.getStoreProductBySlugHandler);
router.post("/orders", auth_1.requireCustomerAuth, (0, validate_1.validate)({
    body: zod_1.z.object({
        cartId: zod_1.z.string().optional(),
        channel: zod_1.z.enum(["Site", "WhatsApp", "Instagram", "Marketplace"]).optional(),
        shippingMethod: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.string().optional(),
        couponCode: zod_1.z.string().optional(),
        cashbackUsedCents: zod_1.z.number().int().optional(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().min(1),
            qty: zod_1.z.number().int().positive(),
            variant: zod_1.z.string().optional(),
            sizeLabel: zod_1.z.string().optional(),
        })),
        address: zod_1.z.object({
            fullName: zod_1.z.string().min(2),
            email: zod_1.z.string().email(),
            phone: zod_1.z.string().min(3),
            zip: zod_1.z.string().min(3),
            state: zod_1.z.string().min(2),
            city: zod_1.z.string().min(2),
            neighborhood: zod_1.z.string().min(2),
            street: zod_1.z.string().min(2),
            number: zod_1.z.string().min(1),
            complement: zod_1.z.string().optional(),
        }),
    }),
}), orders_controller_1.createStoreOrderHandler);
router.post("/coupons/validate", (0, validate_1.validate)({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1),
        subtotalCents: zod_1.z.number().int().nonnegative(),
    }),
}), coupons_controller_1.validateCouponHandler);
router.post("/cashback/redeem", auth_1.requireCustomerAuth, (0, validate_1.validate)({
    body: zod_1.z.object({
        amount: zod_1.z.number().positive(),
        orderId: zod_1.z.string().optional(),
    }),
}), cashback_controller_1.redeemCashbackStoreHandler);
router.post("/tickets", auth_1.optionalAuth, (0, validate_1.validate)({
    body: zod_1.z.object({
        subject: zod_1.z.string().min(3),
        customerName: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        priority: zod_1.z.enum(["baixa", "media", "alta"]).optional(),
        message: zod_1.z.string().optional(),
    }),
}), support_controller_1.createStoreTicketHandler);
exports.default = router;
