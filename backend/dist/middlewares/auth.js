"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_REFRESH_COOKIE = exports.LEGACY_ACCESS_COOKIE = exports.REFRESH_COOKIE = exports.ACCESS_COOKIE = void 0;
exports.optionalAuth = optionalAuth;
exports.requireAuth = requireAuth;
exports.requireAdminAuth = requireAdminAuth;
exports.requireCustomerAuth = requireCustomerAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const apiError_1 = require("../utils/apiError");
exports.ACCESS_COOKIE = "access_token";
exports.REFRESH_COOKIE = "refresh_token";
exports.LEGACY_ACCESS_COOKIE = "marima_access";
exports.LEGACY_REFRESH_COOKIE = "marima_refresh";
function readAccessToken(req) {
    const rawCookie = req.cookies?.[exports.ACCESS_COOKIE] || req.cookies?.[exports.LEGACY_ACCESS_COOKIE];
    const header = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;
    return rawCookie || header || null;
}
function isTokenExpiredError(error) {
    if (!error || typeof error !== "object")
        return false;
    return "name" in error && error.name === "TokenExpiredError";
}
function decodeAccess(req) {
    const token = readAccessToken(req);
    if (!token)
        return { payload: null, reason: "missing" };
    try {
        return { payload: jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET), reason: "ok" };
    }
    catch (error) {
        if (isTokenExpiredError(error))
            return { payload: null, reason: "expired" };
        return { payload: null, reason: "invalid" };
    }
}
function optionalAuth(req, _res, next) {
    const { payload } = decodeAccess(req);
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
    const { payload, reason } = decodeAccess(req);
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
    const { payload, reason } = decodeAccess(req);
    if (!payload) {
        const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
        const message = reason === "missing" ? "Acesso administrativo não autenticado." : "Sessão expirada.";
        next(new apiError_1.ApiError(401, message, code));
        return;
    }
    if (payload.type !== "admin") {
        next(new apiError_1.ApiError(401, "Acesso administrativo não autenticado.", "AUTH_REQUIRED"));
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
    const { payload, reason } = decodeAccess(req);
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
