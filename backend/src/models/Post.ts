import { createDocumentModel } from "../lib/documentModel";

export type PostDocument = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  topic?: string;
  topic2?: string;
  featured?: boolean;
  readingMinutes?: number;
  published?: boolean;
  publishedAt?: Date;
  authorName?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const PostModel = createDocumentModel("Post");
