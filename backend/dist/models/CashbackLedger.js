"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashbackLedgerModel = void 0;
const mongoose_1 = require("mongoose");
const cashbackLedgerSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Types.ObjectId, ref: "Customer", required: true, index: true },
    orderId: { type: mongoose_1.Types.ObjectId, ref: "Order", index: true },
    type: { type: String, enum: ["credit", "debit", "expire"], required: true, index: true },
    amountCents: { type: Number, required: true },
    balanceAfterCents: { type: Number, required: true },
    expiresAt: { type: Date, index: true },
    note: { type: String, trim: true },
}, { timestamps: true });
exports.CashbackLedgerModel = mongoose_1.models.CashbackLedger || (0, mongoose_1.model)("CashbackLedger", cashbackLedgerSchema);
