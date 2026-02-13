"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
exports.registerCustomer = registerCustomer;
exports.loginCustomer = loginCustomer;
exports.loginAdmin = loginAdmin;
exports.inviteAdminUser = inviteAdminUser;
exports.meFromPayload = meFromPayload;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const AdminUser_1 = require("../models/AdminUser");
const Customer_1 = require("../models/Customer");
const apiError_1 = require("../utils/apiError");
const auth_1 = require("../middlewares/auth");
const cookies_1 = require("../utils/cookies");
const SALT_ROUNDS = 10;
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: env_1.env.ACCESS_TOKEN_TTL,
    });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.REFRESH_TOKEN_TTL,
    });
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
}
function parseDurationMs(text) {
    const unit = text.slice(-1);
    const value = Number(text.slice(0, -1));
    if (unit === "m")
        return value * 60 * 1000;
    if (unit === "h")
        return value * 60 * 60 * 1000;
    if (unit === "d")
        return value * 24 * 60 * 60 * 1000;
    return 15 * 60 * 1000;
}
function setAuthCookies(res, payload, req) {
    const access = signAccessToken(payload);
    const refresh = signRefreshToken(payload);
    res.cookie(auth_1.ACCESS_COOKIE, access, (0, cookies_1.cookieOptions)(req, parseDurationMs(env_1.env.ACCESS_TOKEN_TTL)));
    res.cookie(auth_1.REFRESH_COOKIE, refresh, (0, cookies_1.cookieOptions)(req, parseDurationMs(env_1.env.REFRESH_TOKEN_TTL)));
}
function clearAuthCookies(res, req) {
    res.clearCookie(auth_1.ACCESS_COOKIE, (0, cookies_1.cookieBaseOptions)(req));
    res.clearCookie(auth_1.REFRESH_COOKIE, (0, cookies_1.cookieBaseOptions)(req));
}
async function registerCustomer(input) {
    const email = input.email.trim().toLowerCase();
    const exists = await Customer_1.CustomerModel.findOne({ email });
    if (exists)
        throw new apiError_1.ApiError(409, "E-mail já cadastrado.");
    const passwordHash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
    const created = await Customer_1.CustomerModel.create({
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || undefined,
        passwordHash,
        segment: "novo",
    });
    return created;
}
async function loginCustomer(input) {
    const email = input.email.trim().toLowerCase();
    const user = await Customer_1.CustomerModel.findOne({ email });
    if (!user)
        throw new apiError_1.ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");
    if (!user.active)
        throw new apiError_1.ApiError(403, "Usuário inativo.", "FORBIDDEN");
    const ok = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!ok)
        throw new apiError_1.ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");
    return user;
}
async function loginAdmin(input) {
    const email = input.email.trim().toLowerCase();
    const user = await AdminUser_1.AdminUserModel.findOne({ email });
    if (!user)
        throw new apiError_1.ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");
    if (!user.active)
        throw new apiError_1.ApiError(403, "Usuário inativo.", "FORBIDDEN");
    const ok = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!ok)
        throw new apiError_1.ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");
    user.lastLoginAt = new Date();
    await user.save();
    return user;
}
async function inviteAdminUser(input) {
    const email = input.email.trim().toLowerCase();
    const exists = await AdminUser_1.AdminUserModel.findOne({ email });
    if (exists)
        throw new apiError_1.ApiError(409, "Já existe usuário com este e-mail.");
    const passwordHash = await bcryptjs_1.default.hash(input.temporaryPassword, SALT_ROUNDS);
    return AdminUser_1.AdminUserModel.create({
        name: input.name.trim(),
        email,
        role: input.role,
        passwordHash,
        active: true,
        tempPassword: true,
    });
}
async function meFromPayload(payload) {
    if (payload.type === "admin") {
        const admin = await AdminUser_1.AdminUserModel.findById(payload.sub).select("name email role active createdAt");
        if (!admin)
            throw new apiError_1.ApiError(401, "Sessão expirada.", "AUTH_EXPIRED");
        return {
            id: String(admin._id),
            type: "admin",
            name: admin.name,
            email: admin.email,
            role: admin.role,
            active: admin.active,
            createdAt: admin.createdAt?.toISOString(),
        };
    }
    const customer = await Customer_1.CustomerModel.findById(payload.sub).select("name email phone segment active createdAt");
    if (!customer)
        throw new apiError_1.ApiError(401, "Sessão expirada.", "AUTH_EXPIRED");
    return {
        id: String(customer._id),
        type: "customer",
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        segment: customer.segment,
        active: customer.active,
        createdAt: customer.createdAt?.toISOString(),
    };
}
