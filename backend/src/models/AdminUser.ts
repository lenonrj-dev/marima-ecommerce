import { createDocumentModel } from "../lib/documentModel";

export type Role = "admin" | "operacao" | "marketing" | "suporte";

export type AdminUserDocument = {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  tempPassword?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export const AdminUserModel = createDocumentModel("AdminUser");
