import { createDocumentModel } from "../lib/documentModel";

export type CashbackLedgerDocument = {
  _id: string;
  customerId: string;
  orderId?: string;
  type: "credit" | "debit" | "expire";
  amountCents: number;
  balanceAfterCents: number;
  expiresAt?: Date;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CashbackLedgerModel = createDocumentModel("CashbackLedger");
