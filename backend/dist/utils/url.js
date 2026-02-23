"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBaseUrl = normalizeBaseUrl;
exports.ensureHttps = ensureHttps;
exports.requireHttpsInProd = requireHttpsInProd;
exports.buildStoreRedirectUrls = buildStoreRedirectUrls;
const env_1 = require("../config/env");
const apiError_1 = require("./apiError");
function normalizeBaseUrl(raw, label) {
    const value = String(raw ?? "").trim();
    if (!value) {
        if (label)
            throw new apiError_1.ApiError(400, `Config inválida: ${label} não informado.`, "INVALID_CONFIG");
        return "";
    }
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new apiError_1.ApiError(400, label ? `Config inválida: ${label} deve ser uma URL válida.` : "Config inválida: URL deve ser uma URL válida.", "INVALID_CONFIG");
    }
    parsed.hash = "";
    parsed.search = "";
    let pathname = parsed.pathname || "";
    if (pathname === "/")
        pathname = "";
    else
        pathname = pathname.replace(/\/+$/, "");
    return `${parsed.origin}${pathname}`;
}
function ensureHttps(url, label) {
    const base = normalizeBaseUrl(url, label);
    let parsed;
    try {
        parsed = new URL(base);
    }
    catch {
        throw new apiError_1.ApiError(400, `Config inválida: ${label} deve ser uma URL válida.`, "INVALID_CONFIG");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new apiError_1.ApiError(400, `Config inválida: ${label} deve começar com http:// ou https://.`, "INVALID_CONFIG");
    }
    if (parsed.protocol === "http:") {
        if (env_1.env.NODE_ENV === "production") {
            throw new apiError_1.ApiError(400, `Config inválida: ${label} deve ser HTTPS em produção.`, "INVALID_CONFIG");
        }
        console.warn(`[URLS] ${label} em HTTP (permitido apenas em desenvolvimento): ${base}`);
        return base;
    }
    return base;
}
function requireHttpsInProd(url, label) {
    if (env_1.env.NODE_ENV !== "production")
        return;
    if (!url.startsWith("https://")) {
        throw new apiError_1.ApiError(400, `Config inválida: ${label} deve ser HTTPS em produção.`, "INVALID_CONFIG");
    }
}
function buildStoreRedirectUrls(storeUrl) {
    const base = ensureHttps(storeUrl, "STORE_URL");
    const hostname = new URL(base).hostname.toLowerCase();
    if ((hostname === "localhost" || hostname === "127.0.0.1") && env_1.env.NODE_ENV !== "production") {
        console.warn("[URLS] STORE_URL local detectada. Para callbacks externos do Mercado Pago, use ngrok/URL pública.");
    }
    const success = `${base}/checkout/success`;
    const failure = `${base}/checkout/failure`;
    const pending = `${base}/checkout/pending`;
    requireHttpsInProd(base, "STORE_URL");
    requireHttpsInProd(success, "MP back_urls.success");
    requireHttpsInProd(failure, "MP back_urls.failure");
    requireHttpsInProd(pending, "MP back_urls.pending");
    return { base, success, failure, pending };
}
