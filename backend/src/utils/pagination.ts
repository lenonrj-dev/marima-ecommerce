import { Request } from "express";

export type PaginationInput = {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  q: string;
};

export function getPagination(req: Request, defaultSort = "-createdAt"): PaginationInput {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const skip = (page - 1) * limit;
  const sort = String(req.query.sort || defaultSort);
  const q = String(req.query.q || "").trim();

  return { page, limit, skip, sort, q };
}

export function buildMeta(total: number, page: number, limit: number) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, pages };
}
