"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchAdminCommentStatusHandler = exports.createPostCommentHandler = exports.listPostCommentsHandler = void 0;
const notFound_1 = require("../../../middlewares/notFound");
const comments_service_1 = require("./comments.service");
exports.listPostCommentsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const cursor = String(req.query.cursor || "").trim() || undefined;
    const data = await (0, comments_service_1.listPostComments)({
        slug: String(req.params.slug || "").trim(),
        limit,
        cursor,
        viewer: req.auth
            ? {
                sub: req.auth.sub,
                type: req.auth.type,
            }
            : undefined,
    });
    res.json({ data });
});
exports.createPostCommentHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, comments_service_1.createPostComment)({
        slug: String(req.params.slug || "").trim(),
        customerId: req.auth.sub,
        content: String(req.body.content || ""),
        parentId: typeof req.body.parentId === "string" ? req.body.parentId : undefined,
        ip: req.ip,
    });
    res.status(201).json({ data });
});
exports.patchAdminCommentStatusHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, comments_service_1.patchCommentStatus)({
        id: String(req.params.id || "").trim(),
        status: req.body.status,
    });
    res.json({ data });
});
