"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieBaseOptions = cookieBaseOptions;
exports.cookieOptions = cookieOptions;
const env_1 = require("../config/env");
function isLocalhostHost(value) {
    const host = value.toLowerCase();
    return host.includes("localhost") || host.includes("127.0.0.1");
}
function shouldUseCrossSiteCookies(req) {
    if (env_1.isProd)
        return true;
    if (!req)
        return false;
    const host = typeof req.headers.host === "string" ? req.headers.host : "";
    if (host.toLowerCase().includes("ngrok"))
        return true;
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
    if (!origin)
        return false;
    const isHttpsOrigin = origin.toLowerCase().startsWith("https://");
    if (!isHttpsOrigin)
        return false;
    // Evita quebrar DEV local (http://localhost:*).
    if (isLocalhostHost(origin))
        return false;
    // Para origens HTTPS externas (Vercel/produção), usa SameSite=None.
    return true;
}
function cookieBaseOptions(req) {
    const crossSite = shouldUseCrossSiteCookies(req);
    const sameSite = crossSite ? "none" : "lax";
    const secure = crossSite ? true : env_1.isProd;
    return {
        httpOnly: true,
        secure,
        sameSite,
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
