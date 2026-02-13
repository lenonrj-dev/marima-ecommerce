import { InferSchemaType, Schema, model, models } from "mongoose";

export type Role = "admin" | "operacao" | "marketing" | "suporte";

const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "operacao", "marketing", "suporte"],
      default: "operacao",
      index: true,
    },
    active: { type: Boolean, default: true, index: true },
    tempPassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema>;

export const AdminUserModel = models.AdminUser || model("AdminUser", adminUserSchema);
