import { InferSchemaType, Schema, model, models } from "mongoose";

const cashbackRuleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    validDays: { type: Number, required: true, min: 1 },
    minSubtotalCents: { type: Number, required: true, min: 0 },
    maxCashbackCents: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type CashbackRuleDocument = InferSchemaType<typeof cashbackRuleSchema>;

export const CashbackRuleModel = models.CashbackRule || model("CashbackRule", cashbackRuleSchema);
