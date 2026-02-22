import type { Request } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const LEGACY_ACCESS_COOKIE = "marima_access";
export const LEGACY_REFRESH_COOKIE = "marima_refresh";

export type AccessTokenPayload = {
  sub: string;
  role: string;
  type: "admin" | "customer";
};

export type AuthDecodeReason = "ok" | "missing" | "expired" | "invalid";

export function getToken(req: Request) {
  const rawCookie = req.cookies?.[ACCESS_COOKIE] || req.cookies?.[LEGACY_ACCESS_COOKIE];
  if (typeof rawCookie === "string" && rawCookie) return rawCookie;

  const authorization = req.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  return null;
}

function isTokenExpiredError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return "name" in error && (error as { name?: string }).name === "TokenExpiredError";
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function decodeAuth(req: Request): { payload: AccessTokenPayload | null; reason: AuthDecodeReason } {
  const token = getToken(req);
  if (!token) return { payload: null, reason: "missing" };

  try {
    return { payload: verifyToken(token), reason: "ok" };
  } catch (error) {
    if (isTokenExpiredError(error)) return { payload: null, reason: "expired" };
    return { payload: null, reason: "invalid" };
  }
}
