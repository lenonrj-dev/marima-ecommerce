import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Prisma, type AdminRole } from "@prisma/client";
import { Request, Response } from "express";
import { env } from "../config/env";
import { delCache, getOrSetCache } from "../lib/cache";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { ACCESS_COOKIE, LEGACY_ACCESS_COOKIE, LEGACY_REFRESH_COOKIE, REFRESH_COOKIE } from "../middlewares/auth";
import { cookieClearOptions, cookieOptions } from "../utils/cookies";

const SALT_ROUNDS = 10;
const ME_CACHE_TTL_SECONDS = 60;

export type Role = AdminRole;

type TokenPayload = {
  sub: string;
  role: Role | "customer";
  type: "admin" | "customer";
};

function toCleanTokenPayload(input: unknown): TokenPayload {
  if (!input || typeof input !== "object") {
    throw new ApiError(401, "Sessão expirada.", "AUTH_EXPIRED");
  }

  const raw = input as Partial<Record<keyof TokenPayload, unknown>>;
  const sub = typeof raw.sub === "string" ? raw.sub.trim() : "";
  const role = typeof raw.role === "string" ? raw.role.trim() : "";
  const type = raw.type;

  if (!sub || !role || (type !== "admin" && type !== "customer")) {
    throw new ApiError(401, "Sessão expirada.", "AUTH_EXPIRED");
  }

  return {
    sub,
    role: role as TokenPayload["role"],
    type,
  };
}

function meCacheKey(payload: TokenPayload) {
  return `cache:v1:user:me:${payload.type}:${payload.sub}`;
}

export async function invalidateMeCacheForUser(userId: string) {
  await Promise.all([
    delCache(`cache:v1:user:me:admin:${userId}`),
    delCache(`cache:v1:user:me:customer:${userId}`),
  ]);
}

export function signAccessToken(payload: TokenPayload) {
  const cleanPayload = toCleanTokenPayload(payload);
  return jwt.sign(cleanPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: TokenPayload) {
  const cleanPayload = toCleanTokenPayload(payload);
  return jwt.sign(cleanPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return toCleanTokenPayload(decoded);
}

function parseDurationMs(text: string) {
  const unit = text.slice(-1);
  const value = Number(text.slice(0, -1));
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000;
}

export function setAuthCookies(res: Response, payload: TokenPayload, req?: Request) {
  const cleanPayload = toCleanTokenPayload(payload);
  const access = signAccessToken(cleanPayload);
  const refresh = signRefreshToken(cleanPayload);

  res.cookie(ACCESS_COOKIE, access, cookieOptions(req, parseDurationMs(env.ACCESS_TOKEN_TTL)));
  res.cookie(REFRESH_COOKIE, refresh, cookieOptions(req, parseDurationMs(env.REFRESH_TOKEN_TTL)));
}

export function clearAuthCookies(res: Response, req?: Request) {
  const cookieNames = [ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_ACCESS_COOKIE, LEGACY_REFRESH_COOKIE];
  const clearOptions = cookieClearOptions(req);

  for (const cookieName of cookieNames) {
    for (const options of clearOptions) {
      res.clearCookie(cookieName, options);
    }
  }
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    return await prisma.customer.create({
      data: {
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || undefined,
        passwordHash,
        segment: "novo",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "E-mail j\u00E1 cadastrado.");
    }
    throw error;
  }
}

export async function loginCustomer(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.customer.findUnique({ where: { email } });

  if (!user) throw new ApiError(401, "Credenciais inv\u00E1lidas.", "AUTH_INVALID_CREDENTIALS");
  if (!user.active) throw new ApiError(403, "Usu\u00E1rio inativo.", "FORBIDDEN");
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Credenciais inv\u00E1lidas.", "AUTH_INVALID_CREDENTIALS");

  return user;
}

export async function loginAdmin(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user) throw new ApiError(401, "Credenciais inv\u00E1lidas.", "AUTH_INVALID_CREDENTIALS");
  if (!user.active) throw new ApiError(403, "Usu\u00E1rio inativo.", "FORBIDDEN");
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Credenciais inv\u00E1lidas.", "AUTH_INVALID_CREDENTIALS");

  return prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
}

export async function inviteAdminUser(input: {
  name: string;
  email: string;
  role: Role;
  temporaryPassword: string;
}) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.temporaryPassword, SALT_ROUNDS);

  try {
    return await prisma.adminUser.create({
      data: {
        name: input.name.trim(),
        email,
        role: input.role,
        passwordHash,
        active: true,
        tempPassword: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "J\u00E1 existe usu\u00E1rio com este e-mail.");
    }
    throw error;
  }
}

export async function meFromPayload(payload: TokenPayload) {
  return getOrSetCache(meCacheKey(payload), ME_CACHE_TTL_SECONDS, async () => {
    if (payload.type === "admin") {
      const admin = await prisma.adminUser.findUnique({
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

      if (!admin) throw new ApiError(401, "Sess\u00E3o expirada.", "AUTH_EXPIRED");

      return {
        id: admin.id,
        type: "admin" as const,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        active: admin.active,
        createdAt: admin.createdAt.toISOString(),
      };
    }

    const customer = await prisma.customer.findUnique({
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

    if (!customer) throw new ApiError(401, "Sess\u00E3o expirada.", "AUTH_EXPIRED");

    return {
      id: customer.id,
      type: "customer" as const,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      segment: customer.segment,
      active: customer.active,
      createdAt: customer.createdAt.toISOString(),
    };
  });
}
