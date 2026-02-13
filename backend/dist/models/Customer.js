"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModel = void 0;
const mongoose_1 = require("mongoose");
const customerSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    segment: {
        type: String,
        enum: ["vip", "recorrente", "novo", "inativo"],
        default: "novo",
        index: true,
    },
    ordersCount: { type: Number, default: 0 },
    totalSpentCents: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
}, { timestamps: true });
customerSchema.index({ name: "text", email: "text", phone: "text", tags: "text" });
exports.CustomerModel = mongoose_1.models.Customer || (0, mongoose_1.model)("Customer", customerSchema);
