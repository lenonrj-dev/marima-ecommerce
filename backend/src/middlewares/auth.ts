import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const LEGACY_ACCESS_COOKIE = "marima_access";
export const LEGACY_REFRESH_COOKIE = "marima_refresh";

type TokenPayload = {
  sub: string;
  role: string;
  type: "admin" | "customer";
};

type DecodeReason = "ok" | "missing" | "expired" | "invalid";

function readAccessToken(req: Request) {
  const rawCookie = req.cookies?.[ACCESS_COOKIE] || req.cookies?.[LEGACY_ACCESS_COOKIE];
  const header = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  return rawCookie || header || null;
}

function isTokenExpiredError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return "name" in error && (error as { name?: string }).name === "TokenExpiredError";
}

function decodeAccess(req: Request): { payload: TokenPayload | null; reason: DecodeReason } {
  const token = readAccessToken(req);
  if (!token) return { payload: null, reason: "missing" };

  try {
    return { payload: jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload, reason: "ok" };
  } catch (error) {
    if (isTokenExpiredError(error)) return { payload: null, reason: "expired" };
    return { payload: null, reason: "invalid" };
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const { payload } = decodeAccess(req);
  if (payload) {
    req.auth = {
      sub: payload.sub,
      role: payload.role as any,
      type: payload.type,
    };
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const { payload, reason } = decodeAccess(req);
  if (!payload) {
    const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
    const message = reason === "missing" ? "Não autenticado." : "Sessão expirada.";
    next(new ApiError(401, message, code));
    return;
  }

  req.auth = {
    sub: payload.sub,
    role: payload.role as any,
    type: payload.type,
  };

  next();
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const { payload, reason } = decodeAccess(req);
  if (!payload) {
    const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
    const message = reason === "missing" ? "Acesso administrativo não autenticado." : "Sessão expirada.";
    next(new ApiError(401, message, code));
    return;
  }

  if (payload.type !== "admin") {
    next(new ApiError(401, "Acesso administrativo não autenticado.", "AUTH_REQUIRED"));
    return;
  }

  req.auth = {
    sub: payload.sub,
    role: payload.role as any,
    type: payload.type,
  };

  next();
}

export function requireCustomerAuth(req: Request, _res: Response, next: NextFunction) {
  const { payload, reason } = decodeAccess(req);
  if (!payload) {
    const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
    const message = reason === "missing" ? "Acesso do cliente não autenticado." : "Sessão expirada.";
    next(new ApiError(401, message, code));
    return;
  }

  if (payload.type !== "customer") {
    next(new ApiError(401, "Acesso do cliente não autenticado.", "AUTH_REQUIRED"));
    return;
  }

  req.auth = {
    sub: payload.sub,
    role: payload.role as any,
    type: payload.type,
  };

  next();
}
