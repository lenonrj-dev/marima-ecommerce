import { createDocumentModel } from "../lib/documentModel";

export type FavoriteDocument = {
  _id: string;
  customerId: string;
  productId: string;
  slug: string;
  title: string;
  image: string;
  priceCents: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export const FavoriteModel = createDocumentModel("Favorite");
