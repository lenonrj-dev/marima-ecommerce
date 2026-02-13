"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashbackRuleModel = void 0;
const mongoose_1 = require("mongoose");
const cashbackRuleSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    validDays: { type: Number, required: true, min: 1 },
    minSubtotalCents: { type: Number, required: true, min: 0 },
    maxCashbackCents: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
}, { timestamps: true });
exports.CashbackRuleModel = mongoose_1.models.CashbackRule || (0, mongoose_1.model)("CashbackRule", cashbackRuleSchema);
