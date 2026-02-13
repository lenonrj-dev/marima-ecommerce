"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meHandler = exports.refreshHandler = exports.logoutHandler = exports.loginAdminHandler = exports.loginCustomerHandler = exports.registerCustomerHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middlewares/auth");
const carts_service_1 = require("../services/carts.service");
const cookies_1 = require("../utils/cookies");
exports.registerCustomerHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const user = await (0, auth_service_1.registerCustomer)(req.body);
    const guestToken = req.cookies?.[carts_service_1.GUEST_CART_COOKIE];
    if (typeof guestToken === "string" && guestToken) {
        try {
            await (0, carts_service_1.bindGuestCartToCustomer)(guestToken, String(user._id));
            res.clearCookie(carts_service_1.GUEST_CART_COOKIE, (0, cookies_1.cookieBaseOptions)(req));
        }
        catch {
            // Ignore cart merge failures.
        }
    }
    (0, auth_service_1.setAuthCookies)(res, {
        sub: String(user._id),
        role: "customer",
        type: "customer",
    }, req);
    res.status(201).json({
        data: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            phone: user.phone,
            segment: user.segment,
            createdAt: user.createdAt?.toISOString(),
        },
    });
});
exports.loginCustomerHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const user = await (0, auth_service_1.loginCustomer)(req.body);
    const guestToken = req.cookies?.[carts_service_1.GUEST_CART_COOKIE];
    if (typeof guestToken === "string" && guestToken) {
        try {
            await (0, carts_service_1.bindGuestCartToCustomer)(guestToken, String(user._id));
            res.clearCookie(carts_service_1.GUEST_CART_COOKIE, (0, cookies_1.cookieBaseOptions)(req));
        }
        catch {
            // Ignore cart merge failures.
        }
    }
    (0, auth_service_1.setAuthCookies)(res, {
        sub: String(user._id),
        role: "customer",
        type: "customer",
    }, req);
    res.json({
        data: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            phone: user.phone,
            segment: user.segment,
        },
    });
});
exports.loginAdminHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const user = await (0, auth_service_1.loginAdmin)(req.body);
    (0, auth_service_1.setAuthCookies)(res, {
        sub: String(user._id),
        role: user.role,
        type: "admin",
    }, req);
    res.json({
        data: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active,
        },
    });
});
exports.logoutHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    (0, auth_service_1.clearAuthCookies)(res, req);
    res.json({ data: { success: true } });
});
exports.refreshHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const refresh = req.cookies?.[auth_1.REFRESH_COOKIE] || req.cookies?.[auth_1.LEGACY_REFRESH_COOKIE];
    if (!refresh) {
        res.status(401).json({ code: "AUTH_REQUIRED", message: "Não autenticado." });
        return;
    }
    let payload;
    try {
        payload = (0, auth_service_1.verifyRefreshToken)(refresh);
    }
    catch {
        (0, auth_service_1.clearAuthCookies)(res, req);
        res.status(401).json({ code: "AUTH_EXPIRED", message: "Sessão expirada." });
        return;
    }
    (0, auth_service_1.setAuthCookies)(res, payload, req);
    res.json({ data: { success: true } });
});
exports.meHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    if (!req.auth) {
        res.status(401).json({ code: "AUTH_REQUIRED", message: "Não autenticado." });
        return;
    }
    const me = await (0, auth_service_1.meFromPayload)(req.auth);
    res.json({
        data: {
            userType: me.type,
            ...me,
        },
    });
});
