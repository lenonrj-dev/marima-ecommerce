import { Request, Response } from "express";
import { AdminUserModel } from "../models/AdminUser";
import { asyncHandler } from "../middlewares/notFound";
import { buildMeta } from "../utils/pagination";
import { invalidateMeCacheForUser, inviteAdminUser } from "../services/auth.service";

function toAdminUser(row: any) {
  return {
    id: String(row._id),
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

  const query: any = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }
  if (role && role !== "all") query.role = role;

  const [rows, total] = await Promise.all([
    AdminUserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AdminUserModel.countDocuments(query),
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
  const user = await AdminUserModel.findById(String(req.params.id));
  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado." });
    return;
  }

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.active !== undefined) user.active = req.body.active;

  await user.save();
  await invalidateMeCacheForUser(String(user._id));
  res.json({ data: toAdminUser(user) });
});

