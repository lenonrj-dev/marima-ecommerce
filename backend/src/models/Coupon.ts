import { createDocumentModel } from "../lib/documentModel";

export type CouponDocument = {
  _id: string;
  code: string;
  description: string;
  type: "percent" | "fixed" | "shipping";
  amount: number;
  minSubtotalCents?: number;
  uses?: number;
  maxUses?: number;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  redemptions?: Array<{
    _id?: string;
    orderId: string;
    customerId?: string;
    discountCents: number;
    createdAt?: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CouponModel = createDocumentModel("Coupon");
