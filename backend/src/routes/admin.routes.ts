import { Router } from "express";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { validate } from "../middlewares/validate";
import {
  createProductHandler,
  deleteProductHandler,
  getAdminProductByIdHandler,
  listAdminProductsHandler,
  patchProductActivationHandler,
  patchProductHandler,
} from "../controllers/products.controller";
import {
  createCategoryHandler,
  listAdminCategoriesHandler,
  patchCategoryHandler,
} from "../controllers/categories.controller";
import {
  createInventoryAdjustmentHandler,
  inventorySummaryHandler,
  listInventoryItemsHandler,
  listInventoryMovementsHandler,
} from "../controllers/inventory.controller";
import { getAdminOrderByIdHandler, listAdminOrdersHandler, patchAdminOrderStatusHandler } from "../controllers/orders.controller";
import {
  convertAbandonedCartHandler,
  listAbandonedCartsHandler,
  recoverAbandonedCartHandler,
} from "../controllers/carts.controller";
import {
  getAdminCustomerByIdHandler,
  listAdminCustomerOrdersHandler,
  listAdminCustomersHandler,
  patchAdminCustomerHandler,
} from "../controllers/customers.controller";
import {
  createCouponHandler,
  listCouponsHandler,
  patchCouponHandler,
  toggleCouponHandler,
} from "../controllers/coupons.controller";
import {
  createCashbackRuleHandler,
  listCashbackLedgerHandler,
  listCashbackRulesHandler,
  patchCashbackRuleHandler,
  toggleCashbackRuleHandler,
} from "../controllers/cashback.controller";
import {
  addTicketMessageHandler,
  getTicketByIdHandler,
  listTicketMessagesHandler,
  listTicketsHandler,
  patchTicketStatusHandler,
} from "../controllers/support.controller";
import {
  listIntegrationsHandler,
  patchIntegrationHandler,
  testIntegrationWebhookHandler,
} from "../controllers/integrations.controller";
import { getStoreSettingsHandler, patchStoreSettingsHandler } from "../controllers/settings.controller";
import {
  analyticsDeviceHandler,
  analyticsEmailCampaignsHandler,
  analyticsOverviewHandler,
  analyticsRevenueSeriesHandler,
} from "../controllers/analytics.controller";
import {
  deleteAdminReviewHandler,
  listAdminReviewsHandler,
  patchAdminReviewStatusHandler,
} from "../controllers/reviews.controller";
import {
  exportCustomersCsvHandler,
  exportProductsCsvHandler,
  exportSalesCsvHandler,
} from "../controllers/reports.controller";
import { inviteAdminUserHandler, listAdminUsersHandler, patchAdminUserHandler } from "../controllers/adminUsers.controller";

const router = Router();

router.use(requireAdminAuth);

router.get("/products", requireRole("admin", "operacao", "marketing"), listAdminProductsHandler);
router.post(
  "/products",
  requireRole("admin", "operacao"),
  validate({
    body: z.object({
      name: z.string().min(2),
      sku: z.string().min(1),
      groupKey: z.string().optional(),
      colorName: z.string().optional(),
      colorHex: z.string().optional(),
      category: z.string().min(1),
      size: z.string().optional(),
      sizeType: z.enum(["roupas", "numerico", "unico", "custom"]).optional(),
      sizes: z
        .array(
          z.object({
            label: z.string().min(1),
            stock: z.number().int().nonnegative(),
            sku: z.string().optional(),
            active: z.boolean().optional(),
          }),
        )
        .optional(),
      stock: z.number().int().nonnegative(),
      price: z.number().nonnegative(),
      compareAtPrice: z.number().nonnegative().optional(),
      shortDescription: z.string().min(3),
      description: z.string().min(3),
      additionalInfo: z
        .array(
          z.object({
            label: z.string().min(1),
            value: z.string().min(1),
          }),
        )
        .optional(),
      tags: z.array(z.string()).default([]),
      status: z.enum(["padrao", "novo", "destaque", "oferta"]),
      active: z.boolean().default(true),
      images: z.array(z.string().url()).min(1).max(5),
    }),
  }),
  createProductHandler,
);
router.get("/products/:id", requireRole("admin", "operacao", "marketing"), getAdminProductByIdHandler);
router.patch("/products/:id", requireRole("admin", "operacao"), patchProductHandler);
router.patch("/products/:id/activation", requireRole("admin", "operacao"), patchProductActivationHandler);
router.delete("/products/:id", requireRole("admin", "operacao"), deleteProductHandler);
router.get("/reviews", requireRole("admin", "operacao", "marketing", "suporte"), listAdminReviewsHandler);
router.patch(
  "/reviews/:id",
  requireRole("admin", "operacao", "marketing", "suporte"),
  validate({
    body: z.object({
      status: z.enum(["published", "pending", "hidden"]),
    }),
  }),
  patchAdminReviewStatusHandler,
);
router.delete("/reviews/:id", requireRole("admin", "operacao"), deleteAdminReviewHandler);

router.get("/categories", requireRole("admin", "operacao", "marketing"), listAdminCategoriesHandler);
router.post("/categories", requireRole("admin", "operacao"), createCategoryHandler);
router.patch("/categories/:id", requireRole("admin", "operacao"), patchCategoryHandler);

router.get("/inventory/items", requireRole("admin", "operacao"), listInventoryItemsHandler);
router.get("/inventory/summary", requireRole("admin", "operacao"), inventorySummaryHandler);
router.post(
  "/inventory/adjustments",
  requireRole("admin", "operacao"),
  validate({
    body: z.object({
      productId: z.string().min(1),
      type: z.enum(["entrada", "saida", "ajuste", "reserva", "liberacao"]),
      quantity: z.number().int(),
      reason: z.string().min(3),
      sizeLabel: z.string().optional(),
      note: z.string().optional(),
    }),
  }),
  createInventoryAdjustmentHandler,
);
router.get("/inventory/movements", requireRole("admin", "operacao"), listInventoryMovementsHandler);

router.get("/orders", requireRole("admin", "operacao", "suporte"), listAdminOrdersHandler);
router.get("/orders/:id", requireRole("admin", "operacao", "suporte"), getAdminOrderByIdHandler);
router.patch(
  "/orders/:id/status",
  requireRole("admin", "operacao", "suporte"),
  validate({
    body: z.object({
      status: z.enum(["pendente", "pago", "separacao", "enviado", "entregue", "cancelado", "reembolsado"]),
    }),
  }),
  patchAdminOrderStatusHandler,
);

router.get("/abandoned-carts", requireRole("admin", "operacao", "marketing"), listAbandonedCartsHandler);
router.post("/abandoned-carts/:id/recover", requireRole("admin", "operacao", "marketing"), recoverAbandonedCartHandler);
router.post("/abandoned-carts/:id/convert-order", requireRole("admin", "operacao"), convertAbandonedCartHandler);

router.get("/customers", requireRole("admin", "operacao", "marketing", "suporte"), listAdminCustomersHandler);
router.get("/customers/:id", requireRole("admin", "operacao", "marketing", "suporte"), getAdminCustomerByIdHandler);
router.patch("/customers/:id", requireRole("admin", "operacao", "marketing"), patchAdminCustomerHandler);
router.get("/customers/:id/orders", requireRole("admin", "operacao", "suporte"), listAdminCustomerOrdersHandler);

router.get("/coupons", requireRole("admin", "marketing", "operacao"), listCouponsHandler);
router.post("/coupons", requireRole("admin", "marketing"), createCouponHandler);
router.patch("/coupons/:id", requireRole("admin", "marketing"), patchCouponHandler);
router.patch("/coupons/:id/toggle", requireRole("admin", "marketing"), toggleCouponHandler);

router.get("/cashback/rules", requireRole("admin", "marketing", "operacao"), listCashbackRulesHandler);
router.post("/cashback/rules", requireRole("admin", "marketing"), createCashbackRuleHandler);
router.patch("/cashback/rules/:id", requireRole("admin", "marketing"), patchCashbackRuleHandler);
router.patch("/cashback/rules/:id/toggle", requireRole("admin", "marketing"), toggleCashbackRuleHandler);
router.get("/cashback/ledger", requireRole("admin", "marketing", "operacao"), listCashbackLedgerHandler);

router.get("/tickets", requireRole("admin", "suporte", "operacao"), listTicketsHandler);
router.get("/tickets/:id", requireRole("admin", "suporte", "operacao"), getTicketByIdHandler);
router.patch("/tickets/:id/status", requireRole("admin", "suporte", "operacao"), patchTicketStatusHandler);
router.post("/tickets/:id/messages", requireRole("admin", "suporte", "operacao"), addTicketMessageHandler);
router.get("/tickets/:id/messages", requireRole("admin", "suporte", "operacao"), listTicketMessagesHandler);

router.get("/integrations", requireRole("admin", "operacao", "marketing"), listIntegrationsHandler);
router.patch("/integrations/:id", requireRole("admin", "operacao", "marketing"), patchIntegrationHandler);
router.post("/integrations/:id/test-webhook", requireRole("admin", "operacao"), testIntegrationWebhookHandler);

router.get("/settings/store", requireRole("admin", "operacao"), getStoreSettingsHandler);
router.patch("/settings/store", requireRole("admin", "operacao"), patchStoreSettingsHandler);

router.get("/users", requireRole("admin"), listAdminUsersHandler);
router.post(
  "/users/invite",
  requireRole("admin"),
  validate({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(["admin", "operacao", "marketing", "suporte"]),
      temporaryPassword: z.string().min(6),
    }),
  }),
  inviteAdminUserHandler,
);
router.patch("/users/:id", requireRole("admin"), patchAdminUserHandler);

router.get("/analytics/overview", requireRole("admin", "operacao", "marketing"), analyticsOverviewHandler);
router.get("/analytics/revenue-series", requireRole("admin", "operacao", "marketing"), analyticsRevenueSeriesHandler);
router.get("/analytics/device", requireRole("admin", "operacao", "marketing"), analyticsDeviceHandler);
router.get("/analytics/email-campaigns", requireRole("admin", "operacao", "marketing"), analyticsEmailCampaignsHandler);

router.get("/reports/sales/export", requireRole("admin", "operacao", "marketing"), exportSalesCsvHandler);
router.get("/reports/products/export", requireRole("admin", "operacao", "marketing"), exportProductsCsvHandler);
router.get("/reports/customers/export", requireRole("admin", "operacao", "marketing"), exportCustomersCsvHandler);

export default router;
