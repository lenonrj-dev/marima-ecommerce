"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreSettingsModel = void 0;
const mongoose_1 = require("mongoose");
const storeSettingsSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, trim: true, default: "America/Sao_Paulo" },
    currency: { type: String, required: true, trim: true, default: "BRL" },
    supportEmail: { type: String, required: true, trim: true, lowercase: true },
    policy: { type: String, required: true, trim: true },
}, { timestamps: true });
exports.StoreSettingsModel = mongoose_1.models.StoreSettings || (0, mongoose_1.model)("StoreSettings", storeSettingsSchema);
