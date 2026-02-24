"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middlewares/auth");
const env_1 = require("../config/env");
const auth_2 = require("../lib/auth");
const cookies_1 = require("../utils/cookies");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
});
router.post("/customer/register", authLimiter, (0, validate_1.validate)({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        phone: zod_1.z.string().optional(),
    }),
}), auth_controller_1.registerCustomerHandler);
router.post("/customer/login", authLimiter, (0, validate_1.validate)({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1),
    }),
}), auth_controller_1.loginCustomerHandler);
router.post("/admin/login", authLimiter, (0, validate_1.validate)({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1),
    }),
}), auth_controller_1.loginAdminHandler);
router.post("/logout", auth_controller_1.logoutHandler);
router.post("/customer/logout", auth_controller_1.logoutHandler);
router.post("/admin/logout", auth_controller_1.logoutHandler);
router.post("/refresh", auth_controller_1.refreshHandler);
router.get("/me", auth_1.requireAuth, auth_controller_1.meHandler);
router.get("/debug", auth_1.optionalAuth, (req, res) => {
    if (env_1.env.NODE_ENV === "production") {
        res.status(404).json({ message: "Not found" });
        return;
    }
    const token = (0, auth_2.getToken)(req);
    const cookieNames = Object.keys(req.cookies || {});
    const cookieOptions = (0, cookies_1.cookieBaseOptions)(req);
    res.json({
        data: {
            hasToken: Boolean(token),
            authType: req.auth?.type || null,
            authRole: req.auth?.role || null,
            hasAccessCookie: cookieNames.includes("access_token") || cookieNames.includes("marima_access"),
            cookies: cookieNames,
            cookieOptions: {
                sameSite: cookieOptions.sameSite,
                secure: cookieOptions.secure,
                domain: cookieOptions.domain || null,
                path: cookieOptions.path,
            },
            origin: req.headers.origin || null,
            host: req.headers.host || null,
        },
    });
});
exports.default = router;
