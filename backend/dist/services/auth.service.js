"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateMeCacheForUser = invalidateMeCacheForUser;
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
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const cache_1 = require("../lib/cache");
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const auth_1 = require("../middlewares/auth");
const cookies_1 = require("../utils/cookies");
const SALT_ROUNDS = 10;
const ME_CACHE_TTL_SECONDS = 60;
function meCacheKey(payload) {
    return `cache:v1:user:me:${payload.type}:${payload.sub}`;
}
async function invalidateMeCacheForUser(userId) {
    await Promise.all([
        (0, cache_1.delCache)(`cache:v1:user:me:admin:${userId}`),
        (0, cache_1.delCache)(`cache:v1:user:me:customer:${userId}`),
    ]);
}
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
    const passwordHash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
    try {
        return await prisma_1.prisma.customer.create({
            data: {
                name: input.name.trim(),
                email,
                phone: input.phone?.trim() || undefined,
                passwordHash,
                segment: "novo",
            },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new apiError_1.ApiError(409, "E-mail j� cadastrado.");
        }
        throw error;
    }
}
async function loginCustomer(input) {
    const email = input.email.trim().toLowerCase();
    const user = await prisma_1.prisma.customer.findUnique({ where: { email } });
    if (!user)
        throw new apiError_1.ApiError(401, "Credenciais inv�lidas.", "AUTH_INVALID_CREDENTIALS");
    if (!user.active)
        throw new apiError_1.ApiError(403, "Usu�rio inativo.", "FORBIDDEN");
    const ok = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!ok)
        throw new apiError_1.ApiError(401, "Credenciais inv�lidas.", "AUTH_INVALID_CREDENTIALS");
    return user;
}
async function loginAdmin(input) {
    const email = input.email.trim().toLowerCase();
    const user = await prisma_1.prisma.adminUser.findUnique({ where: { email } });
    if (!user)
        throw new apiError_1.ApiError(401, "Credenciais inv�lidas.", "AUTH_INVALID_CREDENTIALS");
    if (!user.active)
        throw new apiError_1.ApiError(403, "Usu�rio inativo.", "FORBIDDEN");
    const ok = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!ok)
        throw new apiError_1.ApiError(401, "Credenciais inv�lidas.", "AUTH_INVALID_CREDENTIALS");
    return prisma_1.prisma.adminUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
}
async function inviteAdminUser(input) {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await bcryptjs_1.default.hash(input.temporaryPassword, SALT_ROUNDS);
    try {
        return await prisma_1.prisma.adminUser.create({
            data: {
                name: input.name.trim(),
                email,
                role: input.role,
                passwordHash,
                active: true,
                tempPassword: true,
            },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new apiError_1.ApiError(409, "J� existe usu�rio com este e-mail.");
        }
        throw error;
    }
}
async function meFromPayload(payload) {
    return (0, cache_1.getOrSetCache)(meCacheKey(payload), ME_CACHE_TTL_SECONDS, async () => {
        if (payload.type === "admin") {
            const admin = await prisma_1.prisma.adminUser.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    active: true,
                    createdAt: true,
                },
            });
            if (!admin)
                throw new apiError_1.ApiError(401, "Sess�o expirada.", "AUTH_EXPIRED");
            return {
                id: admin.id,
                type: "admin",
                name: admin.name,
                email: admin.email,
                role: admin.role,
                active: admin.active,
                createdAt: admin.createdAt.toISOString(),
            };
        }
        const customer = await prisma_1.prisma.customer.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                segment: true,
                active: true,
                createdAt: true,
            },
        });
        if (!customer)
            throw new apiError_1.ApiError(401, "Sess�o expirada.", "AUTH_EXPIRED");
        return {
            id: customer.id,
            type: "customer",
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            segment: customer.segment,
            active: customer.active,
            createdAt: customer.createdAt.toISOString(),
        };
    });
}
