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
const router = (0, express_1.Router)();
router.get("/health", (_req, res) => {
    res.json({ data: { ok: true, service: "backend", timestamp: new Date().toISOString() } });
});
router.use("/auth", auth_routes_1.default);
router.use("/payments", payments_routes_1.default);
router.use("/store", store_routes_1.default);
router.use("/me", me_routes_1.default);
router.use("/admin", admin_routes_1.default);
exports.default = router;
