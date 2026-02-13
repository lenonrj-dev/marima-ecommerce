"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponModel = void 0;
const mongoose_1 = require("mongoose");
const redemptionSchema = new mongoose_1.Schema({
    orderId: { type: mongoose_1.Types.ObjectId, ref: "Order", required: true },
    customerId: { type: mongoose_1.Types.ObjectId, ref: "Customer" },
    discountCents: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });
const couponSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.CouponModel = mongoose_1.models.Coupon || (0, mongoose_1.model)("Coupon", couponSchema);
