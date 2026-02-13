import { InferSchemaType, Schema, Types, model, models } from "mongoose";

const inventoryMovementSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true, index: true },
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
  },
  { timestamps: true },
);

export type InventoryMovementDocument = InferSchemaType<typeof inventoryMovementSchema>;

export const InventoryMovementModel =
  models.InventoryMovement || model("InventoryMovement", inventoryMovementSchema);
