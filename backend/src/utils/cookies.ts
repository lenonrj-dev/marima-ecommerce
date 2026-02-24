import type { Request } from "express";
import { env, isProd } from "../config/env";

type SameSite = "lax" | "none" | "strict";

function isLocalhostHost(value: string) {
  const host = value.toLowerCase();
  return host.includes("localhost") || host.includes("127.0.0.1");
}

function resolveSameSite(req?: Request): SameSite {
  if (env.COOKIE_SAMESITE) return env.COOKIE_SAMESITE;
  if (isProd) return "none";
  if (!req) return "lax";

  const host = typeof req.headers.host === "string" ? req.headers.host : "";
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const originIsHttps = origin.toLowerCase().startsWith("https://");
  const hostIsNgrok = host.toLowerCase().includes("ngrok");

  if (originIsHttps && !isLocalhostHost(origin)) return "none";
  if (hostIsNgrok) return "none";
  return "lax";
}

function resolveSecure(req?: Request) {
  if (typeof env.COOKIE_SECURE === "boolean") return env.COOKIE_SECURE;
  if (isProd) return true;
  if (!req) return false;

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (origin.toLowerCase().startsWith("https://") && !isLocalhostHost(origin)) return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (typeof forwardedProto === "string" && forwardedProto.toLowerCase().includes("https")) return true;

  return false;
}

export function cookieBaseOptions(req?: Request) {
  return {
    httpOnly: true,
    secure: resolveSecure(req),
    sameSite: resolveSameSite(req),
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
  } as const;
}

export function cookieOptions(req: Request | undefined, maxAgeMs: number) {
  return {
    ...cookieBaseOptions(req),
    maxAge: maxAgeMs,
  };
}
