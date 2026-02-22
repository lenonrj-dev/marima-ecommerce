import { Router } from "express";
import { z } from "zod";
import { listStoreCategoriesHandler } from "../controllers/categories.controller";
import { createStoreOrderHandler } from "../controllers/orders.controller";
import { getStoreProductBySlugHandler, getStoreProductVariantsHandler, listStoreProductsHandler } from "../controllers/products.controller";
import { getStoreProductReviewsSummaryHandler, listStoreProductReviewsHandler } from "../controllers/reviews.controller";
import { validateCouponHandler } from "../controllers/coupons.controller";
import { redeemCashbackStoreHandler } from "../controllers/cashback.controller";
import { createStoreTicketHandler } from "../controllers/support.controller";
import { optionalAuth, requireCustomerAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";

const router = Router();

router.get("/categories", listStoreCategoriesHandler);
router.get("/products", listStoreProductsHandler);
router.get(
  "/products/:productId/reviews",
  validate({
    params: z.object({
      productId: z.string().min(1),
    }),
    query: z
      .object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sort: z.enum(["recent", "oldest", "rating_desc", "rating_asc"]).optional(),
      })
      .optional(),
  }),
  listStoreProductReviewsHandler,
);
router.get(
  "/products/:productId/reviews/summary",
  validate({
    params: z.object({
      productId: z.string().min(1),
    }),
  }),
  getStoreProductReviewsSummaryHandler,
);
router.get("/products/:slug/variants", getStoreProductVariantsHandler);
router.get("/products/:slug", getStoreProductBySlugHandler);

router.post(
  "/orders",
  requireCustomerAuth,
  validate({
    body: z.object({
      cartId: z.string().optional(),
      channel: z.enum(["Site", "WhatsApp", "Instagram", "Marketplace"]).optional(),
      shippingMethod: z.string().optional(),
      paymentMethod: z.string().optional(),
      couponCode: z.string().optional(),
      cashbackUsedCents: z.number().int().optional(),
      items: z.array(
        z.object({
          id: z.string().min(1),
          qty: z.number().int().positive(),
          variant: z.string().optional(),
          sizeLabel: z.string().optional(),
        }),
      ),
      address: z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(3),
        zip: z.string().min(3),
        state: z.string().min(2),
        city: z.string().min(2),
        neighborhood: z.string().min(2),
        street: z.string().min(2),
        number: z.string().min(1),
        complement: z.string().optional(),
      }),
    }),
  }),
  createStoreOrderHandler,
);

router.post(
  "/coupons/validate",
  validate({
    body: z.object({
      code: z.string().min(1),
      subtotalCents: z.number().int().nonnegative(),
    }),
  }),
  validateCouponHandler,
);

router.post(
  "/cashback/redeem",
  requireCustomerAuth,
  validate({
    body: z.object({
      amount: z.number().positive(),
      orderId: z.string().optional(),
    }),
  }),
  redeemCashbackStoreHandler,
);

router.post(
  "/tickets",
  optionalAuth,
  validate({
    body: z.object({
      subject: z.string().min(3),
      customerName: z.string().min(2),
      email: z.string().email(),
      priority: z.enum(["baixa", "media", "alta"]).optional(),
      message: z.string().optional(),
    }),
  }),
  createStoreTicketHandler,
);

export default router;
