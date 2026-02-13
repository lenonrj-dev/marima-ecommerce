import { InferSchemaType, Schema, Types, model, models } from "mongoose";

export type PaymentProvider = "mercadopago";
export type PaymentTransactionStatus =
  | "initiated"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

const paymentTransactionSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["mercadopago"],
      required: true,
      index: true,
    },
    orderId: { type: Types.ObjectId, ref: "Order", required: true, index: true },
    preferenceId: { type: String, trim: true, index: true },
    paymentId: { type: String, trim: true, index: true },
    merchantOrderId: { type: String, trim: true },
    status: {
      type: String,
      enum: ["initiated", "pending", "approved", "rejected", "cancelled"],
      default: "initiated",
      index: true,
    },
    cancelToken: { type: String, trim: true, index: true },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentTransactionSchema.index({ provider: 1, orderId: 1, createdAt: -1 });

export type PaymentTransactionDocument = InferSchemaType<typeof paymentTransactionSchema>;

export const PaymentTransactionModel =
  models.PaymentTransaction || model("PaymentTransaction", paymentTransactionSchema);

