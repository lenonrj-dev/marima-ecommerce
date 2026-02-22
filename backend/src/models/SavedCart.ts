import { createDocumentModel } from "../lib/documentModel";

export type SavedCartItemDocument = {
  _id?: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  variant?: string;
  sizeLabel?: string;
  unitPriceCents: number;
  qty: number;
  stock: number;
};

export type SavedCartDocument = {
  _id: string;
  customerId: string;
  sourceCartId?: string;
  title?: string;
  items: SavedCartItemDocument[];
  itemCount: number;
  couponCode?: string;
  discountCents?: number;
  shippingCents?: number;
  taxCents?: number;
  subtotalCents?: number;
  totalCents?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export const SavedCartModel = createDocumentModel("SavedCart");
