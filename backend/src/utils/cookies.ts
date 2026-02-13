import type { Request } from "express";
import { env, isProd } from "../config/env";

type SameSite = "lax" | "none";

function isLocalhostHost(value: string) {
  const host = value.toLowerCase();
  return host.includes("localhost") || host.includes("127.0.0.1");
}

function shouldUseCrossSiteCookies(req?: Request) {
  if (isProd) return true;
  if (!req) return false;

  const host = typeof req.headers.host === "string" ? req.headers.host : "";
  if (host.toLowerCase().includes("ngrok")) return true;

  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (!origin) return false;

  const isHttpsOrigin = origin.toLowerCase().startsWith("https://");
  if (!isHttpsOrigin) return false;

  // Evita quebrar DEV local (http://localhost:*).
  if (isLocalhostHost(origin)) return false;

  // Para origens HTTPS externas (Vercel/produção), usa SameSite=None.
  return true;
}

export function cookieBaseOptions(req?: Request) {
  const crossSite = shouldUseCrossSiteCookies(req);
  const sameSite: SameSite = crossSite ? "none" : "lax";
  const secure = crossSite ? true : isProd;

  return {
    httpOnly: true,
    secure,
    sameSite,
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

