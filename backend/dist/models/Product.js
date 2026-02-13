"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");
const productSizeSchema = new mongoose_1.Schema({
    label: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, uppercase: true },
    active: { type: Boolean, default: true },
}, { _id: false });
const productSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    sku: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    groupKey: { type: String, trim: true, index: true },
    colorName: { type: String, trim: true, index: true },
    colorHex: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    categoryId: { type: mongoose_1.Types.ObjectId, ref: "Category" },
    size: { type: String, trim: true },
    sizeType: {
        type: String,
        enum: ["roupas", "numerico", "unico", "custom"],
        default: "unico",
        index: true,
    },
    sizes: { type: [productSizeSchema], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0, index: true },
    priceCents: { type: Number, required: true, min: 0 },
    compareAtPriceCents: { type: Number, min: 0 },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    status: {
        type: String,
        enum: ["padrao", "novo", "destaque", "oferta"],
        default: "padrao",
        index: true,
    },
    active: { type: Boolean, default: true, index: true },
    images: {
        type: [String],
        validate: {
            validator: (value) => value.length > 0 && value.length <= 5,
            message: "O produto deve ter entre 1 e 5 imagens.",
        },
        required: true,
    },
}, { timestamps: true });
productSchema.index({ name: "text", shortDescription: "text", tags: "text" });
exports.ProductModel = mongoose_1.models.Product || (0, mongoose_1.model)("Product", productSchema);
