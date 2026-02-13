import { InferSchemaType, Schema, Types, model, models } from "mongoose";

const favoriteSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: "Customer", required: true, index: true },
    productId: { type: Types.ObjectId, ref: "Product", required: true, index: true },
    slug: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

favoriteSchema.index({ customerId: 1, productId: 1 }, { unique: true });

export type FavoriteDocument = InferSchemaType<typeof favoriteSchema>;

export const FavoriteModel = models.Favorite || model("Favorite", favoriteSchema);
