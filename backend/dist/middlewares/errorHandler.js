"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const apiError_1 = require("../utils/apiError");
function errorHandler(error, req, res, _next) {
    if (error instanceof apiError_1.ApiError) {
        if (error.statusCode >= 500) {
            console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${error.statusCode}`, error);
        }
        const payload = { message: error.message };
        if (error.code)
            payload.code = error.code;
        res.status(error.statusCode).json(payload);
        return;
    }
    if (error instanceof zod_1.ZodError) {
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
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            res.status(409).json({ code: "CONFLICT", message: "Registro duplicado para campo único." });
            return;
        }
        if (error.code === "P2025") {
            res.status(404).json({ code: "NOT_FOUND", message: "Registro não encontrado." });
            return;
        }
        console.error(`[ERROR] ${req.method} ${req.originalUrl} -> 500`, error);
        res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." });
        return;
    }
    if (error instanceof Error) {
        console.error(`[ERROR] ${req.method} ${req.originalUrl} -> 500`, error);
        res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." });
        return;
    }
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -> 500`, error);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." });
}
