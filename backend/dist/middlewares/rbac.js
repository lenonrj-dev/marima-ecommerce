"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const apiError_1 = require("../utils/apiError");
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.auth || req.auth.type !== "admin") {
            next(new apiError_1.ApiError(401, "Não autenticado.", "AUTH_REQUIRED"));
            return;
        }
        if (!roles.includes(req.auth.role)) {
            next(new apiError_1.ApiError(403, "Sem permissão para esta ação.", "FORBIDDEN"));
            return;
        }
        next();
    };
}
