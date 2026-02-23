import { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/notFound";
import { createPostComment, listPostComments, patchCommentStatus } from "./comments.service";

export const listPostCommentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const cursor = String(req.query.cursor || "").trim() || undefined;

  const data = await listPostComments({
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

export const createPostCommentHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createPostComment({
    slug: String(req.params.slug || "").trim(),
    customerId: req.auth!.sub,
    content: String(req.body.content || ""),
    parentId: typeof req.body.parentId === "string" ? req.body.parentId : undefined,
    ip: req.ip,
  });

  res.status(201).json({ data });
});

export const patchAdminCommentStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await patchCommentStatus({
    id: String(req.params.id || "").trim(),
    status: req.body.status,
  });

  res.json({ data });
});
