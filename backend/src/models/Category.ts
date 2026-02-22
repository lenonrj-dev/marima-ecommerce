import { createDocumentModel } from "../lib/documentModel";

export type CategoryDocument = {
  _id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export const CategoryModel = createDocumentModel("Category");
