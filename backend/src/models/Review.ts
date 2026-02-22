import { createDocumentModel } from "../lib/documentModel";

export type ReviewStatus = "published" | "pending" | "hidden";

export type ReviewDocument = {
  _id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  verifiedPurchase?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export const ReviewModel = createDocumentModel("Review");
