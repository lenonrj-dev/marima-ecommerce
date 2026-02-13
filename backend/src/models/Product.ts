import { InferSchemaType, Schema, Types, model, models } from "mongoose";

export type ProductStatus = "padrao" | "novo" | "destaque" | "oferta";
export type ProductSizeType = "roupas" | "numerico" | "unico" | "custom";

const productSizeSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, uppercase: true },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    sku: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    groupKey: { type: String, trim: true, index: true },
    colorName: { type: String, trim: true, index: true },
    colorHex: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    categoryId: { type: Types.ObjectId, ref: "Category" },
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
        validator: (value: string[]) => value.length > 0 && value.length <= 5,
        message: "O produto deve ter entre 1 e 5 imagens.",
      },
      required: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", shortDescription: "text", tags: "text" });

export type ProductDocument = InferSchemaType<typeof productSchema>;

export const ProductModel = models.Product || model("Product", productSchema);
