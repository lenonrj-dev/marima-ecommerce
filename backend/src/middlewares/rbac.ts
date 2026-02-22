import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { Role } from "../models/AdminUser";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || req.auth.type !== "admin") {
      next(new ApiError(401, "Não autenticado.", "AUTH_REQUIRED"));
      return;
    }

    if (!roles.includes(req.auth.role as Role)) {
      next(new ApiError(403, "Sem permissão para esta ação.", "FORBIDDEN"));
      return;
    }

    next();
  };
}
