import { Router } from "express";
import { z } from "zod";
import {
  createMeAddressHandler,
  createMeFavoriteHandler,
  deleteMeAddressHandler,
  deleteMeFavoriteHandler,
  getMeProfileHandler,
  listMeAddressesHandler,
  listMeFavoritesHandler,
  patchMeAddressHandler,
  patchMeProfileHandler,
} from "../controllers/customers.controller";
import {
  applyMeCartCouponHandler,
  deleteMeSavedCartHandler,
  deleteMeCartItemHandler,
  getMeSavedCartHandler,
  getMeCartHandler,
  listMeSavedCartsHandler,
  loadMeSavedCartHandler,
  putMeCartItemHandler,
  patchMeCartItemHandler,
  revokeMeSavedCartShareHandler,
  removeMeCartCouponHandler,
  saveMeCartHandler,
  shareMeSavedCartHandler,
} from "../controllers/carts.controller";
import { createMeReviewHandler, listMeReviewsHandler } from "../controllers/reviews.controller";
import { getMeCashbackBalanceHandler } from "../controllers/cashback.controller";
import { getMeOrderByIdHandler, listMeOrdersHandler } from "../controllers/orders.controller";
import { optionalAuth, requireCustomerAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";

const router = Router();

router.get("/profile", requireCustomerAuth, getMeProfileHandler);
router.patch(
  "/profile",
  requireCustomerAuth,
  validate({ body: z.object({ name: z.string().optional(), phone: z.string().optional() }) }),
  patchMeProfileHandler,
);

router.get("/orders", requireCustomerAuth, listMeOrdersHandler);
router.get("/orders/:id", requireCustomerAuth, getMeOrderByIdHandler);

router.get("/cart", optionalAuth, getMeCartHandler);
router.put(
  "/cart/items",
  optionalAuth,
  validate({
    body: z.object({
      productId: z.string().min(1),
      qty: z.number().int().positive().default(1),
      variant: z.string().optional(),
      sizeLabel: z.string().optional(),
    }),
  }),
  putMeCartItemHandler,
);
router.patch(
  "/cart/items/:itemId",
  optionalAuth,
  validate({ body: z.object({ qty: z.number().int().positive() }) }),
  patchMeCartItemHandler,
);
router.delete("/cart/items/:itemId", optionalAuth, deleteMeCartItemHandler);
router.post(
  "/cart/apply-coupon",
  optionalAuth,
  validate({ body: z.object({ code: z.string().min(1) }) }),
  applyMeCartCouponHandler,
);
router.post("/cart/remove-coupon", optionalAuth, removeMeCartCouponHandler);
router.post("/cart/saved", requireCustomerAuth, saveMeCartHandler);
router.get("/cart/saved", requireCustomerAuth, listMeSavedCartsHandler);
router.get("/cart/saved/:savedCartId", requireCustomerAuth, getMeSavedCartHandler);
router.delete("/cart/saved/:savedCartId", requireCustomerAuth, deleteMeSavedCartHandler);
router.post("/cart/saved/:savedCartId/share", requireCustomerAuth, shareMeSavedCartHandler);
router.delete("/cart/saved/:savedCartId/share", requireCustomerAuth, revokeMeSavedCartShareHandler);
router.post("/cart/saved/:savedCartId/load", requireCustomerAuth, loadMeSavedCartHandler);

// Compatibilidade temporária
router.post("/cart/save", requireCustomerAuth, saveMeCartHandler);
router.post("/cart/load/:savedCartId", requireCustomerAuth, loadMeSavedCartHandler);

router.post(
  "/reviews",
  requireCustomerAuth,
  validate({
    body: z.object({
      productId: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().min(5).max(2000),
    }),
  }),
  createMeReviewHandler,
);
router.get("/reviews", requireCustomerAuth, listMeReviewsHandler);

router.get("/addresses", requireCustomerAuth, listMeAddressesHandler);
router.post(
  "/addresses",
  requireCustomerAuth,
  validate({
    body: z.object({
      label: z.string().min(1),
      fullName: z.string().min(2),
      zip: z.string().min(3),
      state: z.string().min(2),
      city: z.string().min(2),
      neighborhood: z.string().min(2),
      street: z.string().min(2),
      number: z.string().min(1),
      complement: z.string().optional(),
      isDefault: z.boolean().optional(),
    }),
  }),
  createMeAddressHandler,
);
router.patch("/addresses/:id", requireCustomerAuth, patchMeAddressHandler);
router.delete("/addresses/:id", requireCustomerAuth, deleteMeAddressHandler);

router.get("/favorites", requireCustomerAuth, listMeFavoritesHandler);
router.post(
  "/favorites",
  requireCustomerAuth,
  validate({ body: z.object({ productId: z.string().min(1) }) }),
  createMeFavoriteHandler,
);
router.delete("/favorites/:productId", requireCustomerAuth, deleteMeFavoriteHandler);

router.get("/cashback/balance", requireCustomerAuth, getMeCashbackBalanceHandler);

export default router;
