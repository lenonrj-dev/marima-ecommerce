import { createDocumentModel } from "../lib/documentModel";

export type CashbackRuleDocument = {
  _id: string;
  name: string;
  percent: number;
  validDays: number;
  minSubtotalCents: number;
  maxCashbackCents: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CashbackRuleModel = createDocumentModel("CashbackRule");
