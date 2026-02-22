import { createDocumentModel } from "../lib/documentModel";

export type ProductStatus = "padrao" | "novo" | "destaque" | "oferta";
export type ProductSizeType = "roupas" | "numerico" | "unico" | "custom";

export type ProductDocument = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  groupKey?: string;
  colorName?: string;
  colorHex?: string;
  category: string;
  categoryId?: string;
  size?: string;
  sizeType?: ProductSizeType;
  sizes?: Array<{ label: string; stock: number; sku?: string; active?: boolean }>;
  stock: number;
  priceCents: number;
  compareAtPriceCents?: number;
  shortDescription: string;
  description: string;
  additionalInfo?: Array<{ label: string; value: string }>;
  tags?: string[];
  reviewAverage?: number;
  reviewCount?: number;
  status?: ProductStatus;
  active?: boolean;
  images: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const ProductModel = createDocumentModel("Product");
