import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    const payload: Record<string, unknown> = { message: error.message };
    if (error.code) payload.code = error.code;
    res.status(error.statusCode).json(payload);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Validação inválida.",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({ code: "BAD_REQUEST", message: error.message });
    return;
  }

  res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." });
}
