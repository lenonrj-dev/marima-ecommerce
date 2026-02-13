import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Request, Response } from "express";
import { env } from "../config/env";
import { AdminUserModel, Role } from "../models/AdminUser";
import { CustomerModel } from "../models/Customer";
import { ApiError } from "../utils/apiError";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../middlewares/auth";
import { cookieBaseOptions, cookieOptions } from "../utils/cookies";

const SALT_ROUNDS = 10;

type TokenPayload = {
  sub: string;
  role: Role | "customer";
  type: "admin" | "customer";
};

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

function parseDurationMs(text: string) {
  const unit = text.slice(-1);
  const value = Number(text.slice(0, -1));
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000;
}

export function setAuthCookies(
  res: Response,
  payload: TokenPayload,
  req?: Request,
) {
  const access = signAccessToken(payload);
  const refresh = signRefreshToken(payload);

  res.cookie(ACCESS_COOKIE, access, cookieOptions(req, parseDurationMs(env.ACCESS_TOKEN_TTL)));
  res.cookie(REFRESH_COOKIE, refresh, cookieOptions(req, parseDurationMs(env.REFRESH_TOKEN_TTL)));
}

export function clearAuthCookies(res: Response, req?: Request) {
  res.clearCookie(ACCESS_COOKIE, cookieBaseOptions(req));
  res.clearCookie(REFRESH_COOKIE, cookieBaseOptions(req));
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const exists = await CustomerModel.findOne({ email });
  if (exists) throw new ApiError(409, "E-mail já cadastrado.");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const created = await CustomerModel.create({
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    passwordHash,
    segment: "novo",
  });

  return created;
}

export async function loginCustomer(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await CustomerModel.findOne({ email });

  if (!user) throw new ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");
  if (!user.active) throw new ApiError(403, "Usuário inativo.", "FORBIDDEN");
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");

  return user;
}

export async function loginAdmin(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await AdminUserModel.findOne({ email });

  if (!user) throw new ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");
  if (!user.active) throw new ApiError(403, "Usuário inativo.", "FORBIDDEN");
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Credenciais inválidas.", "AUTH_INVALID_CREDENTIALS");

  user.lastLoginAt = new Date();
  await user.save();

  return user;
}

export async function inviteAdminUser(input: {
  name: string;
  email: string;
  role: Role;
  temporaryPassword: string;
}) {
  const email = input.email.trim().toLowerCase();
  const exists = await AdminUserModel.findOne({ email });
  if (exists) throw new ApiError(409, "Já existe usuário com este e-mail.");

  const passwordHash = await bcrypt.hash(input.temporaryPassword, SALT_ROUNDS);
  return AdminUserModel.create({
    name: input.name.trim(),
    email,
    role: input.role,
    passwordHash,
    active: true,
    tempPassword: true,
  });
}

export async function meFromPayload(payload: TokenPayload) {
  if (payload.type === "admin") {
    const admin = await AdminUserModel.findById(payload.sub).select("name email role active createdAt");
    if (!admin) throw new ApiError(401, "Sessão expirada.", "AUTH_EXPIRED");

    return {
      id: String(admin._id),
      type: "admin" as const,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      active: admin.active,
      createdAt: admin.createdAt?.toISOString(),
    };
  }

  const customer = await CustomerModel.findById(payload.sub).select("name email phone segment active createdAt");
  if (!customer) throw new ApiError(401, "Sessão expirada.", "AUTH_EXPIRED");

  return {
    id: String(customer._id),
    type: "customer" as const,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    segment: customer.segment,
    active: customer.active,
    createdAt: customer.createdAt?.toISOString(),
  };
}
