"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserModel = void 0;
const mongoose_1 = require("mongoose");
const adminUserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ["admin", "operacao", "marketing", "suporte"],
        default: "operacao",
        index: true,
    },
    active: { type: Boolean, default: true, index: true },
    tempPassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
}, { timestamps: true });
exports.AdminUserModel = mongoose_1.models.AdminUser || (0, mongoose_1.model)("AdminUser", adminUserSchema);
