"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieBaseOptions = cookieBaseOptions;
exports.cookieOptions = cookieOptions;
const env_1 = require("../config/env");
function isLocalhostHost(value) {
    const host = value.toLowerCase();
    return host.includes("localhost") || host.includes("127.0.0.1");
}
function resolveSameSite(req) {
    if (env_1.env.COOKIE_SAMESITE)
        return env_1.env.COOKIE_SAMESITE;
    if (env_1.isProd)
        return "none";
    if (!req)
        return "lax";
    const host = typeof req.headers.host === "string" ? req.headers.host : "";
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
    const originIsHttps = origin.toLowerCase().startsWith("https://");
    const hostIsNgrok = host.toLowerCase().includes("ngrok");
    if (originIsHttps && !isLocalhostHost(origin))
        return "none";
    if (hostIsNgrok)
        return "none";
    return "lax";
}
function resolveSecure(req) {
    if (typeof env_1.env.COOKIE_SECURE === "boolean")
        return env_1.env.COOKIE_SECURE;
    if (env_1.isProd)
        return true;
    if (!req)
        return false;
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
    if (origin.toLowerCase().startsWith("https://") && !isLocalhostHost(origin))
        return true;
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (typeof forwardedProto === "string" && forwardedProto.toLowerCase().includes("https"))
        return true;
    return false;
}
function cookieBaseOptions(req) {
    return {
        httpOnly: true,
        secure: resolveSecure(req),
        sameSite: resolveSameSite(req),
        domain: env_1.env.COOKIE_DOMAIN || undefined,
        path: "/",
    };
}
function cookieOptions(req, maxAgeMs) {
    return {
        ...cookieBaseOptions(req),
        maxAge: maxAgeMs,
    };
}
