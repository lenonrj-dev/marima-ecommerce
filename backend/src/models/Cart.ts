import { createDocumentModel } from "../lib/documentModel";

export type CartItemDocument = {
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

export type CartDocument = {
  _id: string;
  customerId?: string;
  guestToken?: string;
  items: CartItemDocument[];
  couponCode?: string;
  freeShippingCouponApplied?: boolean;
  discountCents?: number;
  shippingCents?: number;
  taxCents?: number;
  subtotalCents?: number;
  totalCents?: number;
  status?: "active" | "abandoned" | "converted";
  recovered?: boolean;
  lastActivityAt?: Date;
  notes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const CartModel = createDocumentModel("Cart");
