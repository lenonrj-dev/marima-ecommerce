"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = getPagination;
exports.buildMeta = buildMeta;
function getPagination(req, defaultSort = "-createdAt") {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;
    const sort = String(req.query.sort || defaultSort);
    const q = String(req.query.q || "").trim();
    return { page, limit, skip, sort, q };
}
function buildMeta(total, page, limit) {
    const pages = Math.max(1, Math.ceil(total / limit));
    return { total, page, limit, pages };
}
