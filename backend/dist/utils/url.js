"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBaseUrl = normalizeBaseUrl;
exports.assertHttpsInProduction = assertHttpsInProduction;
const env_1 = require("../config/env");
const apiError_1 = require("./apiError");
function normalizeBaseUrl(raw, label) {
    const value = String(raw || "").trim();
    if (!value) {
        throw new apiError_1.ApiError(400, `Config inválida: ${label} não informado.`, "INVALID_CONFIG");
    }
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new apiError_1.ApiError(400, `Config inválida: ${label} deve ser uma URL válida.`, "INVALID_CONFIG");
    }
    return parsed.origin;
}
function assertHttpsInProduction(url, label) {
    if (env_1.env.NODE_ENV !== "production")
        return;
    if (!url.startsWith("https://")) {
        throw new apiError_1.ApiError(400, `Config inválida: ${label} deve ser HTTPS em produção.`, "INVALID_CONFIG");
    }
}
