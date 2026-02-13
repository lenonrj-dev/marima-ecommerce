import { InferSchemaType, Schema, Types, model, models } from "mongoose";

const redemptionSchema = new Schema(
  {
    orderId: { type: Types.ObjectId, ref: "Order", required: true },
    customerId: { type: Types.ObjectId, ref: "Customer" },
    discountCents: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const couponSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ["percent", "fixed", "shipping"], required: true },
    amount: { type: Number, required: true, min: 0 },
    minSubtotalCents: { type: Number, min: 0 },
    uses: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, min: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    active: { type: Boolean, default: true, index: true },
    redemptions: { type: [redemptionSchema], default: [] },
  },
  { timestamps: true },
);

export type CouponDocument = InferSchemaType<typeof couponSchema>;

export const CouponModel = models.Coupon || model("Coupon", couponSchema);
