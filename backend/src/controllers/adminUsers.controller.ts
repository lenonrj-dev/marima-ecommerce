import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middlewares/notFound";
import { buildMeta } from "../utils/pagination";
import { invalidateMeCacheForUser, inviteAdminUser } from "../services/auth.service";

function toAdminUser(row: any) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    tempPassword: row.tempPassword,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export const listAdminUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const q = String(req.query.q || "").trim();
  const role = String(req.query.role || "").trim();

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role && role !== "all") where.role = role;

  const [rows, total] = await Promise.all([
    prisma.adminUser.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminUser.count({ where }),
  ]);

  res.json({
    data: rows.map(toAdminUser),
    meta: buildMeta(total, page, limit),
  });
});

export const inviteAdminUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const created = await inviteAdminUser({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    temporaryPassword: req.body.temporaryPassword,
  });

  res.status(201).json({ data: toAdminUser(created) });
});

export const patchAdminUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado." });
    return;
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      ...(req.body.name !== undefined ? { name: req.body.name } : {}),
      ...(req.body.role !== undefined ? { role: req.body.role } : {}),
      ...(req.body.active !== undefined ? { active: req.body.active } : {}),
    },
  });

  await invalidateMeCacheForUser(updated.id);
  res.json({ data: toAdminUser(updated) });
});
