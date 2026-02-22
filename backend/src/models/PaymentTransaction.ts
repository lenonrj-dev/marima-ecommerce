import { createDocumentModel } from "../lib/documentModel";

export type PaymentProvider = "mercadopago";
export type PaymentTransactionStatus =
  | "initiated"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type PaymentTransactionDocument = {
  _id: string;
  provider: PaymentProvider;
  orderId: string;
  preferenceId?: string;
  paymentId?: string;
  merchantOrderId?: string;
  status: PaymentTransactionStatus;
  cancelToken?: string;
  raw?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export const PaymentTransactionModel = createDocumentModel("PaymentTransaction");
