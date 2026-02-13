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
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.get("/health", (_req, res) => {
    res.json({
        data: {
            ok: true,
            service: "backend",
            env: env_1.env.NODE_ENV,
            uptime: process.uptime(),
            port: Number(process.env.RUNTIME_PORT || env_1.env.PORT),
            timestamp: new Date().toISOString(),
        },
    });
});
router.use("/auth", auth_routes_1.default);
router.use("/payments", payments_routes_1.default);
router.use("/store", store_routes_1.default);
router.use("/me", me_routes_1.default);
router.use("/admin", admin_routes_1.default);
exports.default = router;
