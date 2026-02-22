import { createDocumentModel } from "../lib/documentModel";

export type CustomerAddressDocument = {
  _id: string;
  customerId: string;
  label: string;
  fullName: string;
  zip: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CustomerAddressModel = createDocumentModel("CustomerAddress");
