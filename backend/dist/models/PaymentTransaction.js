"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransactionModel = void 0;
const mongoose_1 = require("mongoose");
const paymentTransactionSchema = new mongoose_1.Schema({
    provider: {
        type: String,
        enum: ["mercadopago"],
        required: true,
        index: true,
    },
    orderId: { type: mongoose_1.Types.ObjectId, ref: "Order", required: true, index: true },
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
    raw: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
paymentTransactionSchema.index({ provider: 1, orderId: 1, createdAt: -1 });
exports.PaymentTransactionModel = mongoose_1.models.PaymentTransaction || (0, mongoose_1.model)("PaymentTransaction", paymentTransactionSchema);
