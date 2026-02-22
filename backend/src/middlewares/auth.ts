import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import {
  ACCESS_COOKIE,
  LEGACY_ACCESS_COOKIE,
  LEGACY_REFRESH_COOKIE,
  REFRESH_COOKIE,
  decodeAuth,
} from "../lib/auth";

export { ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_ACCESS_COOKIE, LEGACY_REFRESH_COOKIE };

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const { payload } = decodeAuth(req);
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
  const { payload, reason } = decodeAuth(req);
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
  const { payload, reason } = decodeAuth(req);
  if (!payload) {
    const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
    const message = reason === "missing" ? "Acesso administrativo não autenticado." : "Sessão expirada.";
    next(new ApiError(401, message, code));
    return;
  }

  if (payload.type !== "admin") {
    next(new ApiError(403, "Sem permissão para esta ação.", "FORBIDDEN"));
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
  const { payload, reason } = decodeAuth(req);
  if (!payload) {
    const code = reason === "missing" ? "AUTH_REQUIRED" : "AUTH_EXPIRED";
    const message = reason === "missing" ? "Acesso do cliente não autenticado." : "Sessão expirada.";
    next(new ApiError(401, message, code));
    return;
  }

  if (payload.type !== "customer") {
    next(new ApiError(403, "Sem permissão para esta ação.", "FORBIDDEN"));
    return;
  }

  req.auth = {
    sub: payload.sub,
    role: payload.role as any,
    type: payload.type,
  };

  next();
}
