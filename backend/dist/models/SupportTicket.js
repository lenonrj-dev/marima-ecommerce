"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketModel = void 0;
const mongoose_1 = require("mongoose");
const supportMessageSchema = new mongoose_1.Schema({
    authorType: { type: String, enum: ["customer", "agent"], required: true },
    authorId: { type: mongoose_1.Types.ObjectId },
    authorName: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });
const supportTicketSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, index: true },
    customerId: { type: mongoose_1.Types.ObjectId, ref: "Customer", index: true },
    subject: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    status: {
        type: String,
        enum: ["aberto", "em_andamento", "resolvido"],
        default: "aberto",
        index: true,
    },
    priority: { type: String, enum: ["baixa", "media", "alta"], default: "media", index: true },
    messages: { type: [supportMessageSchema], default: [] },
}, { timestamps: true });
supportTicketSchema.index({ createdAt: -1, status: 1 });
exports.SupportTicketModel = mongoose_1.models.SupportTicket || (0, mongoose_1.model)("SupportTicket", supportTicketSchema);
