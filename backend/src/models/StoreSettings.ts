import { createDocumentModel } from "../lib/documentModel";

export type StoreSettingsDocument = {
  _id: string;
  name: string;
  domain: string;
  timezone: string;
  currency: string;
  supportEmail: string;
  policy: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const StoreSettingsModel = createDocumentModel("StoreSettings");
