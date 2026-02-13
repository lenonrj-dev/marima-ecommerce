"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryMovementModel = void 0;
const mongoose_1 = require("mongoose");
const inventoryMovementSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Types.ObjectId, ref: "Product", required: true, index: true },
    variantId: { type: String, trim: true },
    sizeLabel: { type: String, trim: true },
    type: {
        type: String,
        enum: ["entrada", "saida", "ajuste", "reserva", "liberacao"],
        required: true,
        index: true,
    },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    createdBy: { type: String, trim: true },
    note: { type: String, trim: true },
}, { timestamps: true });
exports.InventoryMovementModel = mongoose_1.models.InventoryMovement || (0, mongoose_1.model)("InventoryMovement", inventoryMovementSchema);
