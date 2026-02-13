import { InferSchemaType, Schema, model, models } from "mongoose";

export type CustomerSegment = "vip" | "recorrente" | "novo" | "inativo";

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    segment: {
      type: String,
      enum: ["vip", "recorrente", "novo", "inativo"],
      default: "novo",
      index: true,
    },
    ordersCount: { type: Number, default: 0 },
    totalSpentCents: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

customerSchema.index({ name: "text", email: "text", phone: "text", tags: "text" });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;

export const CustomerModel = models.Customer || model("Customer", customerSchema);
