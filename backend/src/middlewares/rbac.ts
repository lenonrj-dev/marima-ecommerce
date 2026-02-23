import { NextFunction, Request, Response } from "express";
import { type AdminRole } from "@prisma/client";
import { ApiError } from "../utils/apiError";

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || req.auth.type !== "admin") {
      next(new ApiError(401, "Não autenticado.", "AUTH_REQUIRED"));
      return;
    }

    if (!roles.includes(req.auth.role as AdminRole)) {
      next(new ApiError(403, "Sem permissão para esta ação.", "FORBIDDEN"));
      return;
    }

    next();
  };
}
