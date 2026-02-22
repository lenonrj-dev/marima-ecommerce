"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const store_routes_1 = __importDefault(require("./store.routes"));
const me_routes_1 = __importDefault(require("./me.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const payments_routes_1 = __importDefault(require("./payments.routes"));
const posts_routes_1 = __importDefault(require("./posts.routes"));
const cart_routes_1 = __importDefault(require("./cart.routes"));
const marketing_routes_1 = __importDefault(require("./marketing.routes"));
const env_1 = require("../config/env");
const health_1 = require("../lib/health");
const router = (0, express_1.Router)();
router.get("/health", async (_req, res) => {
    const health = await (0, health_1.runHealthChecks)();
    res.status(health.ok ? 200 : 503).json({
        data: {
            ok: health.ok,
            service: "backend",
            env: env_1.env.NODE_ENV,
            uptime: process.uptime(),
            port: Number(process.env.RUNTIME_PORT || env_1.env.PORT),
            timestamp: new Date().toISOString(),
            checks: health.checks,
        },
    });
});
router.use("/auth", auth_routes_1.default);
router.use("/payments", payments_routes_1.default);
router.use("/store", store_routes_1.default);
router.use("/blog", posts_routes_1.default);
router.use("/marketing", marketing_routes_1.default);
router.use("/me", me_routes_1.default);
router.use("/cart", cart_routes_1.default);
router.use("/admin", admin_routes_1.default);
exports.default = router;
