import { z } from "zod";

export const postCommentParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

export const postCommentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export const postCommentBodySchema = z.object({
  content: z.string().trim().min(3).max(1000),
  parentId: z.string().trim().min(1).optional(),
});

export const adminCommentParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const adminCommentStatusBodySchema = z.object({
  status: z.enum(["published", "hidden", "pending"]),
});

export type PostCommentQueryInput = z.infer<typeof postCommentQuerySchema>;
export type PostCommentBodyInput = z.infer<typeof postCommentBodySchema>;
