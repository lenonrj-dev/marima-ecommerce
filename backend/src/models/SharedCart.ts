import { createDocumentModel } from "../lib/documentModel";

export type SharedCartItemDocument = {
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

export type SharedCartDocument = {
  _id: string;
  token: string;
  sourceCustomerId?: string;
  sourceCartId?: string;
  sourceSavedCartId?: string;
  items: SharedCartItemDocument[];
  itemCount: number;
  couponCode?: string;
  discountCents?: number;
  shippingCents?: number;
  taxCents?: number;
  subtotalCents?: number;
  totalCents?: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export const SharedCartModel = createDocumentModel("SharedCart");
