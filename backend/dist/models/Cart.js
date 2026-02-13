"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const mongoose_1 = require("mongoose");
const cartItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    variant: { type: String, trim: true },
    sizeLabel: { type: String, trim: true },
    unitPriceCents: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0 },
}, { _id: true });
const cartSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Types.ObjectId, ref: "Customer", index: true },
    guestToken: { type: String, index: true, sparse: true },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, trim: true, uppercase: true },
    discountCents: { type: Number, default: 0, min: 0 },
    shippingCents: { type: Number, default: 0, min: 0 },
    taxCents: { type: Number, default: 0, min: 0 },
    subtotalCents: { type: Number, default: 0, min: 0 },
    totalCents: { type: Number, default: 0, min: 0 },
    status: {
        type: String,
        enum: ["active", "abandoned", "converted"],
        default: "active",
        index: true,
    },
    recovered: { type: Boolean, default: false, index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    notes: { type: [String], default: [] },
}, { timestamps: true });
cartSchema.index({ customerId: 1, status: 1 });
cartSchema.index({ guestToken: 1, status: 1 });
exports.CartModel = mongoose_1.models.Cart || (0, mongoose_1.model)("Cart", cartSchema);
