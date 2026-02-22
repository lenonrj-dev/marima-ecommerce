"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const customers_controller_1 = require("../controllers/customers.controller");
const carts_controller_1 = require("../controllers/carts.controller");
const reviews_controller_1 = require("../controllers/reviews.controller");
const cashback_controller_1 = require("../controllers/cashback.controller");
const orders_controller_1 = require("../controllers/orders.controller");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
router.get("/profile", auth_1.requireCustomerAuth, customers_controller_1.getMeProfileHandler);
router.patch("/profile", auth_1.requireCustomerAuth, (0, validate_1.validate)({ body: zod_1.z.object({ name: zod_1.z.string().optional(), phone: zod_1.z.string().optional() }) }), customers_controller_1.patchMeProfileHandler);
router.get("/orders", auth_1.requireCustomerAuth, orders_controller_1.listMeOrdersHandler);
router.get("/orders/:id", auth_1.requireCustomerAuth, orders_controller_1.getMeOrderByIdHandler);
router.get("/cart", auth_1.optionalAuth, carts_controller_1.getMeCartHandler);
router.put("/cart/items", auth_1.optionalAuth, (0, validate_1.validate)({
    body: zod_1.z.object({
        productId: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().positive().default(1),
        variant: zod_1.z.string().optional(),
        sizeLabel: zod_1.z.string().optional(),
    }),
}), carts_controller_1.putMeCartItemHandler);
router.patch("/cart/items/:itemId", auth_1.optionalAuth, (0, validate_1.validate)({ body: zod_1.z.object({ qty: zod_1.z.number().int().positive() }) }), carts_controller_1.patchMeCartItemHandler);
router.delete("/cart/items/:itemId", auth_1.optionalAuth, carts_controller_1.deleteMeCartItemHandler);
router.post("/cart/apply-coupon", auth_1.optionalAuth, (0, validate_1.validate)({ body: zod_1.z.object({ code: zod_1.z.string().min(1) }) }), carts_controller_1.applyMeCartCouponHandler);
router.post("/cart/remove-coupon", auth_1.optionalAuth, carts_controller_1.removeMeCartCouponHandler);
router.post("/cart/saved", auth_1.requireCustomerAuth, carts_controller_1.saveMeCartHandler);
router.get("/cart/saved", auth_1.requireCustomerAuth, carts_controller_1.listMeSavedCartsHandler);
router.get("/cart/saved/:savedCartId", auth_1.requireCustomerAuth, carts_controller_1.getMeSavedCartHandler);
router.delete("/cart/saved/:savedCartId", auth_1.requireCustomerAuth, carts_controller_1.deleteMeSavedCartHandler);
router.post("/cart/saved/:savedCartId/share", auth_1.requireCustomerAuth, carts_controller_1.shareMeSavedCartHandler);
router.delete("/cart/saved/:savedCartId/share", auth_1.requireCustomerAuth, carts_controller_1.revokeMeSavedCartShareHandler);
router.post("/cart/saved/:savedCartId/load", auth_1.requireCustomerAuth, carts_controller_1.loadMeSavedCartHandler);
// Compatibilidade tempor�ria
router.post("/cart/save", auth_1.requireCustomerAuth, carts_controller_1.saveMeCartHandler);
router.post("/cart/load/:savedCartId", auth_1.requireCustomerAuth, carts_controller_1.loadMeSavedCartHandler);
router.post("/reviews", auth_1.requireCustomerAuth, (0, validate_1.validate)({
    body: zod_1.z.object({
        productId: zod_1.z.string().min(1),
        rating: zod_1.z.number().int().min(1).max(5),
        comment: zod_1.z.string().trim().min(5).max(2000),
    }),
}), reviews_controller_1.createMeReviewHandler);
router.get("/reviews", auth_1.requireCustomerAuth, reviews_controller_1.listMeReviewsHandler);
router.get("/addresses", auth_1.requireCustomerAuth, customers_controller_1.listMeAddressesHandler);
router.post("/addresses", auth_1.requireCustomerAuth, (0, validate_1.validate)({
    body: zod_1.z.object({
        label: zod_1.z.string().min(1),
        fullName: zod_1.z.string().min(2),
        zip: zod_1.z.string().min(3),
        state: zod_1.z.string().min(2),
        city: zod_1.z.string().min(2),
        neighborhood: zod_1.z.string().min(2),
        street: zod_1.z.string().min(2),
        number: zod_1.z.string().min(1),
        complement: zod_1.z.string().optional(),
        isDefault: zod_1.z.boolean().optional(),
    }),
}), customers_controller_1.createMeAddressHandler);
router.patch("/addresses/:id", auth_1.requireCustomerAuth, customers_controller_1.patchMeAddressHandler);
router.delete("/addresses/:id", auth_1.requireCustomerAuth, customers_controller_1.deleteMeAddressHandler);
router.get("/favorites", auth_1.requireCustomerAuth, customers_controller_1.listMeFavoritesHandler);
router.post("/favorites", auth_1.requireCustomerAuth, (0, validate_1.validate)({ body: zod_1.z.object({ productId: zod_1.z.string().min(1) }) }), customers_controller_1.createMeFavoriteHandler);
router.delete("/favorites/:productId", auth_1.requireCustomerAuth, customers_controller_1.deleteMeFavoriteHandler);
router.get("/cashback/balance", auth_1.requireCustomerAuth, cashback_controller_1.getMeCashbackBalanceHandler);
exports.default = router;
