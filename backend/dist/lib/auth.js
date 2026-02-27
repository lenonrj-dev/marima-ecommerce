"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_REFRESH_COOKIE = exports.LEGACY_ACCESS_COOKIE = exports.REFRESH_COOKIE = exports.ACCESS_COOKIE = void 0;
exports.getToken = getToken;
exports.verifyToken = verifyToken;
exports.decodeAuth = decodeAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
exports.ACCESS_COOKIE = "access_token";
exports.REFRESH_COOKIE = "refresh_token";
exports.LEGACY_ACCESS_COOKIE = "marima_access";
exports.LEGACY_REFRESH_COOKIE = "marima_refresh";
function getToken(req) {
    const rawCookie = req.cookies?.[exports.ACCESS_COOKIE] || req.cookies?.[exports.LEGACY_ACCESS_COOKIE];
    if (typeof rawCookie === "string" && rawCookie)
        return rawCookie;
    const authorization = req.headers.authorization;
    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
        const token = authorization.slice(7).trim();
        if (token)
            return token;
    }
    return null;
}
function isTokenExpiredError(error) {
    if (!error || typeof error !== "object")
        return false;
    return "name" in error && error.name === "TokenExpiredError";
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
}
function decodeAuth(req) {
    const token = getToken(req);
    if (!token)
        return { payload: null, reason: "missing" };
    try {
        const payload = verifyToken(token);
        if (!Number.isFinite(payload.sessionExpiresAt) || Date.now() >= payload.sessionExpiresAt) {
            return { payload: null, reason: "expired" };
        }
        return { payload, reason: "ok" };
    }
    catch (error) {
        if (isTokenExpiredError(error))
            return { payload: null, reason: "expired" };
        return { payload: null, reason: "invalid" };
    }
}
