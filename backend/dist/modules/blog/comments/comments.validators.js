"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCommentStatusBodySchema = exports.adminCommentParamsSchema = exports.postCommentBodySchema = exports.postCommentQuerySchema = exports.postCommentParamsSchema = void 0;
const zod_1 = require("zod");
exports.postCommentParamsSchema = zod_1.z.object({
    slug: zod_1.z.string().trim().min(1),
});
exports.postCommentQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    cursor: zod_1.z.string().trim().min(1).optional(),
});
exports.postCommentBodySchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(3).max(1000),
    parentId: zod_1.z.string().trim().min(1).optional(),
});
exports.adminCommentParamsSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1),
});
exports.adminCommentStatusBodySchema = zod_1.z.object({
    status: zod_1.z.enum(["published", "hidden", "pending"]),
});
