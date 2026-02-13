import { InferSchemaType, Schema, Types, model, models } from "mongoose";

const cashbackLedgerSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: "Customer", required: true, index: true },
    orderId: { type: Types.ObjectId, ref: "Order", index: true },
    type: { type: String, enum: ["credit", "debit", "expire"], required: true, index: true },
    amountCents: { type: Number, required: true },
    balanceAfterCents: { type: Number, required: true },
    expiresAt: { type: Date, index: true },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

export type CashbackLedgerDocument = InferSchemaType<typeof cashbackLedgerSchema>;

export const CashbackLedgerModel = models.CashbackLedger || model("CashbackLedger", cashbackLedgerSchema);
