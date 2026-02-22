import { createDocumentModel } from "../lib/documentModel";

export type CustomerSegment = "vip" | "recorrente" | "novo" | "inativo";

export type CustomerDocument = {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  segment: CustomerSegment;
  ordersCount?: number;
  totalSpentCents?: number;
  lastOrderAt?: Date;
  tags?: string[];
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CustomerModel = createDocumentModel("Customer");
