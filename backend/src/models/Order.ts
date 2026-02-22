import { createDocumentModel } from "../lib/documentModel";

export type OrderStatus =
  | "pendente"
  | "pago"
  | "separacao"
  | "enviado"
  | "entregue"
  | "cancelado"
  | "reembolsado";

export type OrderItemDocument = {
  _id?: string;
  productId?: string;
  name: string;
  sku?: string;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
  variant?: string;
  sizeLabel?: string;
  slug?: string;
};

export type OrderDocument = {
  _id: string;
  code: string;
  customerId?: string;
  customerName: string;
  email: string;
  status: OrderStatus;
  channel?: "Site" | "WhatsApp" | "Instagram" | "Marketplace";
  shippingMethod?: string;
  paymentMethod?: string;
  shippingTrackingCode?: string;
  paymentStatus?: string;
  paymentProvider?: string;
  paymentPreferenceId?: string;
  paymentId?: string;
  paidAt?: Date;
  cancelledAt?: Date;
  items: OrderItemDocument[];
  itemsCount: number;
  subtotalCents: number;
  discountCents?: number;
  shippingCents?: number;
  taxCents?: number;
  totalCents: number;
  couponCode?: string;
  cashbackUsedCents?: number;
  cashbackGrantedCents?: number;
  address: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
};

export const OrderModel = createDocumentModel("Order");
