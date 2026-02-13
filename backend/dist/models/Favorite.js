"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteModel = void 0;
const mongoose_1 = require("mongoose");
const favoriteSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Types.ObjectId, ref: "Customer", required: true, index: true },
    productId: { type: mongoose_1.Types.ObjectId, ref: "Product", required: true, index: true },
    slug: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
}, { timestamps: true });
favoriteSchema.index({ customerId: 1, productId: 1 }, { unique: true });
exports.FavoriteModel = mongoose_1.models.Favorite || (0, mongoose_1.model)("Favorite", favoriteSchema);
