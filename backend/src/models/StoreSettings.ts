import { InferSchemaType, Schema, model, models } from "mongoose";

const storeSettingsSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, trim: true, default: "America/Sao_Paulo" },
    currency: { type: String, required: true, trim: true, default: "BRL" },
    supportEmail: { type: String, required: true, trim: true, lowercase: true },
    policy: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type StoreSettingsDocument = InferSchemaType<typeof storeSettingsSchema>;

export const StoreSettingsModel = models.StoreSettings || model("StoreSettings", storeSettingsSchema);
