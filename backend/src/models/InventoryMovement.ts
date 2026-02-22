import { createDocumentModel } from "../lib/documentModel";

export type InventoryMovementDocument = {
  _id: string;
  productId: string;
  variantId?: string;
  sizeLabel?: string;
  type: "entrada" | "saida" | "ajuste" | "reserva" | "liberacao";
  quantity: number;
  reason: string;
  createdBy?: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const InventoryMovementModel = createDocumentModel("InventoryMovement");
