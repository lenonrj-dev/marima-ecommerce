"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const validate_1 = require("../middlewares/validate");
const products_controller_1 = require("../controllers/products.controller");
const categories_controller_1 = require("../controllers/categories.controller");
const inventory_controller_1 = require("../controllers/inventory.controller");
const orders_controller_1 = require("../controllers/orders.controller");
const carts_controller_1 = require("../controllers/carts.controller");
const customers_controller_1 = require("../controllers/customers.controller");
const coupons_controller_1 = require("../controllers/coupons.controller");
const cashback_controller_1 = require("../controllers/cashback.controller");
const support_controller_1 = require("../controllers/support.controller");
const integrations_controller_1 = require("../controllers/integrations.controller");
const settings_controller_1 = require("../controllers/settings.controller");
const analytics_controller_1 = require("../controllers/analytics.controller");
const reports_controller_1 = require("../controllers/reports.controller");
const adminUsers_controller_1 = require("../controllers/adminUsers.controller");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdminAuth);
router.get("/products", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), products_controller_1.listAdminProductsHandler);
router.post("/products", (0, rbac_1.requireRole)("admin", "operacao"), (0, validate_1.validate)({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        sku: zod_1.z.string().min(1),
        groupKey: zod_1.z.string().optional(),
        colorName: zod_1.z.string().optional(),
        colorHex: zod_1.z.string().optional(),
        category: zod_1.z.string().min(1),
        size: zod_1.z.string().optional(),
        sizeType: zod_1.z.enum(["roupas", "numerico", "unico", "custom"]).optional(),
        sizes: zod_1.z
            .array(zod_1.z.object({
            label: zod_1.z.string().min(1),
            stock: zod_1.z.number().int().nonnegative(),
            sku: zod_1.z.string().optional(),
            active: zod_1.z.boolean().optional(),
        }))
            .optional(),
        stock: zod_1.z.number().int().nonnegative(),
        price: zod_1.z.number().nonnegative(),
        compareAtPrice: zod_1.z.number().nonnegative().optional(),
        shortDescription: zod_1.z.string().min(3),
        description: zod_1.z.string().min(3),
        tags: zod_1.z.array(zod_1.z.string()).default([]),
        status: zod_1.z.enum(["padrao", "novo", "destaque", "oferta"]),
        active: zod_1.z.boolean().default(true),
        images: zod_1.z.array(zod_1.z.string().url()).min(1).max(5),
    }),
}), products_controller_1.createProductHandler);
router.get("/products/:id", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), products_controller_1.getAdminProductByIdHandler);
router.patch("/products/:id", (0, rbac_1.requireRole)("admin", "operacao"), products_controller_1.patchProductHandler);
router.patch("/products/:id/activation", (0, rbac_1.requireRole)("admin", "operacao"), products_controller_1.patchProductActivationHandler);
router.delete("/products/:id", (0, rbac_1.requireRole)("admin", "operacao"), products_controller_1.deleteProductHandler);
router.get("/categories", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), categories_controller_1.listAdminCategoriesHandler);
router.post("/categories", (0, rbac_1.requireRole)("admin", "operacao"), categories_controller_1.createCategoryHandler);
router.patch("/categories/:id", (0, rbac_1.requireRole)("admin", "operacao"), categories_controller_1.patchCategoryHandler);
router.get("/inventory/items", (0, rbac_1.requireRole)("admin", "operacao"), inventory_controller_1.listInventoryItemsHandler);
router.get("/inventory/summary", (0, rbac_1.requireRole)("admin", "operacao"), inventory_controller_1.inventorySummaryHandler);
router.post("/inventory/adjustments", (0, rbac_1.requireRole)("admin", "operacao"), (0, validate_1.validate)({
    body: zod_1.z.object({
        productId: zod_1.z.string().min(1),
        type: zod_1.z.enum(["entrada", "saida", "ajuste", "reserva", "liberacao"]),
        quantity: zod_1.z.number().int(),
        reason: zod_1.z.string().min(3),
        sizeLabel: zod_1.z.string().optional(),
        note: zod_1.z.string().optional(),
    }),
}), inventory_controller_1.createInventoryAdjustmentHandler);
router.get("/inventory/movements", (0, rbac_1.requireRole)("admin", "operacao"), inventory_controller_1.listInventoryMovementsHandler);
router.get("/orders", (0, rbac_1.requireRole)("admin", "operacao", "suporte"), orders_controller_1.listAdminOrdersHandler);
router.get("/orders/:id", (0, rbac_1.requireRole)("admin", "operacao", "suporte"), orders_controller_1.getAdminOrderByIdHandler);
router.patch("/orders/:id/status", (0, rbac_1.requireRole)("admin", "operacao", "suporte"), (0, validate_1.validate)({
    body: zod_1.z.object({
        status: zod_1.z.enum(["pendente", "pago", "separacao", "enviado", "entregue", "cancelado", "reembolsado"]),
    }),
}), orders_controller_1.patchAdminOrderStatusHandler);
router.get("/abandoned-carts", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), carts_controller_1.listAbandonedCartsHandler);
router.post("/abandoned-carts/:id/recover", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), carts_controller_1.recoverAbandonedCartHandler);
router.post("/abandoned-carts/:id/convert-order", (0, rbac_1.requireRole)("admin", "operacao"), carts_controller_1.convertAbandonedCartHandler);
router.get("/customers", (0, rbac_1.requireRole)("admin", "operacao", "marketing", "suporte"), customers_controller_1.listAdminCustomersHandler);
router.get("/customers/:id", (0, rbac_1.requireRole)("admin", "operacao", "marketing", "suporte"), customers_controller_1.getAdminCustomerByIdHandler);
router.patch("/customers/:id", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), customers_controller_1.patchAdminCustomerHandler);
router.get("/customers/:id/orders", (0, rbac_1.requireRole)("admin", "operacao", "suporte"), customers_controller_1.listAdminCustomerOrdersHandler);
router.get("/coupons", (0, rbac_1.requireRole)("admin", "marketing", "operacao"), coupons_controller_1.listCouponsHandler);
router.post("/coupons", (0, rbac_1.requireRole)("admin", "marketing"), coupons_controller_1.createCouponHandler);
router.patch("/coupons/:id", (0, rbac_1.requireRole)("admin", "marketing"), coupons_controller_1.patchCouponHandler);
router.patch("/coupons/:id/toggle", (0, rbac_1.requireRole)("admin", "marketing"), coupons_controller_1.toggleCouponHandler);
router.get("/cashback/rules", (0, rbac_1.requireRole)("admin", "marketing", "operacao"), cashback_controller_1.listCashbackRulesHandler);
router.post("/cashback/rules", (0, rbac_1.requireRole)("admin", "marketing"), cashback_controller_1.createCashbackRuleHandler);
router.patch("/cashback/rules/:id", (0, rbac_1.requireRole)("admin", "marketing"), cashback_controller_1.patchCashbackRuleHandler);
router.patch("/cashback/rules/:id/toggle", (0, rbac_1.requireRole)("admin", "marketing"), cashback_controller_1.toggleCashbackRuleHandler);
router.get("/cashback/ledger", (0, rbac_1.requireRole)("admin", "marketing", "operacao"), cashback_controller_1.listCashbackLedgerHandler);
router.get("/tickets", (0, rbac_1.requireRole)("admin", "suporte", "operacao"), support_controller_1.listTicketsHandler);
router.get("/tickets/:id", (0, rbac_1.requireRole)("admin", "suporte", "operacao"), support_controller_1.getTicketByIdHandler);
router.patch("/tickets/:id/status", (0, rbac_1.requireRole)("admin", "suporte", "operacao"), support_controller_1.patchTicketStatusHandler);
router.post("/tickets/:id/messages", (0, rbac_1.requireRole)("admin", "suporte", "operacao"), support_controller_1.addTicketMessageHandler);
router.get("/tickets/:id/messages", (0, rbac_1.requireRole)("admin", "suporte", "operacao"), support_controller_1.listTicketMessagesHandler);
router.get("/integrations", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), integrations_controller_1.listIntegrationsHandler);
router.patch("/integrations/:id", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), integrations_controller_1.patchIntegrationHandler);
router.post("/integrations/:id/test-webhook", (0, rbac_1.requireRole)("admin", "operacao"), integrations_controller_1.testIntegrationWebhookHandler);
router.get("/settings/store", (0, rbac_1.requireRole)("admin", "operacao"), settings_controller_1.getStoreSettingsHandler);
router.patch("/settings/store", (0, rbac_1.requireRole)("admin", "operacao"), settings_controller_1.patchStoreSettingsHandler);
router.get("/users", (0, rbac_1.requireRole)("admin"), adminUsers_controller_1.listAdminUsersHandler);
router.post("/users/invite", (0, rbac_1.requireRole)("admin"), (0, validate_1.validate)({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        role: zod_1.z.enum(["admin", "operacao", "marketing", "suporte"]),
        temporaryPassword: zod_1.z.string().min(6),
    }),
}), adminUsers_controller_1.inviteAdminUserHandler);
router.patch("/users/:id", (0, rbac_1.requireRole)("admin"), adminUsers_controller_1.patchAdminUserHandler);
router.get("/analytics/overview", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), analytics_controller_1.analyticsOverviewHandler);
router.get("/analytics/revenue-series", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), analytics_controller_1.analyticsRevenueSeriesHandler);
router.get("/analytics/device", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), analytics_controller_1.analyticsDeviceHandler);
router.get("/analytics/email-campaigns", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), analytics_controller_1.analyticsEmailCampaignsHandler);
router.get("/reports/sales/export", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), reports_controller_1.exportSalesCsvHandler);
router.get("/reports/products/export", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), reports_controller_1.exportProductsCsvHandler);
router.get("/reports/customers/export", (0, rbac_1.requireRole)("admin", "operacao", "marketing"), reports_controller_1.exportCustomersCsvHandler);
exports.default = router;
