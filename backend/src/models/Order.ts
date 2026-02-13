import { InferSchemaType, Schema, Types, model, models } from "mongoose";

export type OrderStatus =
  | "pendente"
  | "pago"
  | "separacao"
  | "enviado"
  | "entregue"
  | "cancelado"
  | "reembolsado";

const orderItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product" },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    qty: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true, min: 0 },
    variant: { type: String, trim: true },
    sizeLabel: { type: String, trim: true },
    slug: { type: String, trim: true },
  },
  { _id: true },
);

const orderAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true },
    complement: { type: String, trim: true },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    customerId: { type: Types.ObjectId, ref: "Customer", index: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["pendente", "pago", "separacao", "enviado", "entregue", "cancelado", "reembolsado"],
      default: "pendente",
      index: true,
    },
    channel: {
      type: String,
      enum: ["Site", "WhatsApp", "Instagram", "Marketplace"],
      default: "Site",
    },
    shippingMethod: { type: String, default: "Padrão" },
    paymentMethod: { type: String, default: "Pendente" },
    shippingTrackingCode: { type: String, trim: true },
    paymentStatus: { type: String, trim: true, default: "pending" },
    paymentProvider: { type: String, trim: true, index: true },
    paymentPreferenceId: { type: String, trim: true, index: true },
    paymentId: { type: String, trim: true, index: true },
    paidAt: { type: Date, index: true },
    cancelledAt: { type: Date, index: true },
    items: { type: [orderItemSchema], default: [] },
    itemsCount: { type: Number, default: 0 },
    subtotalCents: { type: Number, required: true, min: 0 },
    discountCents: { type: Number, default: 0, min: 0 },
    shippingCents: { type: Number, default: 0, min: 0 },
    taxCents: { type: Number, default: 0, min: 0 },
    totalCents: { type: Number, required: true, min: 0, index: true },
    couponCode: { type: String, trim: true, uppercase: true },
    cashbackUsedCents: { type: Number, default: 0, min: 0 },
    cashbackGrantedCents: { type: Number, default: 0, min: 0 },
    address: { type: orderAddressSchema, required: true },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1, status: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export type OrderItemDocument = InferSchemaType<typeof orderItemSchema>;

export const OrderModel = models.Order || model("Order", orderSchema);
