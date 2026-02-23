"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_REFRESH_COOKIE = exports.LEGACY_ACCESS_COOKIE = exports.REFRESH_COOKIE = exports.ACCESS_COOKIE = void 0;
exports.optionalAuth = optionalAuth;
exports.requireAuth = requireAuth;
exports.requireAdminAuth = requireAdminAuth;
exports.requireCustomerAuth = requireCustomerAuth;
const apiError_1 = require("../utils/apiError");
const auth_1 = require("../lib/auth");
Object.defineProperty(exports, "ACCESS_COOKIE", { enumerable: true, get: function () { return auth_1.ACCESS_COOKIE; } });
Object.defineProperty(exports, "LEGACY_ACCESS_COOKIE", { enumerable: true, get: function () { return auth_1.LEGACY_ACCESS_COOKIE; } });
Object.defineProperty(exports, "LEGACY_REFRESH_COOKIE", { enumerable: true, get: function () { return auth_1.LEGACY_REFRESH_COOKIE; } });
Object.defineProperty(exports, "REFRESH_COOKIE", { enumerable: true, get: function () { return auth_1.REFRESH_COOKIE; } });
function optionalAuth(req, _res, next) {
    const { payload } = (0, auth_1.decodeAuth)(req);
    if (payload) {
        req.auth = {
            sub: payload.sub,
            role: payload.role,
            type: payload.type,
        };
    }
    next();
}
function requireAuth(req, _res, next) {
    const { payload, reason } = (0, auth_1.decodeAuth)(req);
    if (!payload) {
        const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
        const message = reason === "missing" ? "Não autenticado." : "Sessão expirada.";
        next(new apiError_1.ApiError(401, message, code));
        return;
    }
    req.auth = {
        sub: payload.sub,
        role: payload.role,
        type: payload.type,
    };
    next();
}
function requireAdminAuth(req, _res, next) {
    const { payload, reason } = (0, auth_1.decodeAuth)(req);
    if (!payload) {
        const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
        const message = reason === "missing" ? "Acesso administrativo não autenticado." : "Sessão expirada.";
        next(new apiError_1.ApiError(401, message, code));
        return;
    }
    if (payload.type !== "admin") {
        next(new apiError_1.ApiError(403, "Sem permissão para esta ação.", "FORBIDDEN"));
        return;
    }
    req.auth = {
        sub: payload.sub,
        role: payload.role,
        type: payload.type,
    };
    next();
}
function requireCustomerAuth(req, _res, next) {
    const { payload, reason } = (0, auth_1.decodeAuth)(req);
    if (!payload) {
        const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
        const message = reason === "missing" ? "Acesso do cliente não autenticado." : "Sessão expirada.";
        next(new apiError_1.ApiError(401, message, code));
        return;
    }
    if (payload.type !== "customer") {
        next(new apiError_1.ApiError(401, "Acesso do cliente não autenticado.", "AUTH_REQUIRED"));
        return;
    }
    req.auth = {
        sub: payload.sub,
        role: payload.role,
        type: payload.type,
    };
    next();
}
