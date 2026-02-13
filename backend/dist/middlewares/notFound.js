"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.asyncHandler = asyncHandler;
function notFound(_req, res) {
    res.status(404).json({ message: "Rota não encontrada." });
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
