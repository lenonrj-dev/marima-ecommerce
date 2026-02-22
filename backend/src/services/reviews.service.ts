import { FilterQuery, Types } from "../lib/dbCompat";
import { CustomerModel } from "../models/Customer";
import { OrderModel } from "../models/Order";
import { ProductModel } from "../models/Product";
import { ReviewModel, ReviewStatus } from "../models/Review";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { invalidateProductCacheByIdentity } from "./products.service";

type ProductIdentity = {
  id: string;
  slug: string;
  title: string;
};

type ProductReviewSummary = {
  avgRating: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

type StoreReviewDTO = {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
};

type AdminReviewDTO = {
  id: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
};

type StoreReviewSort = "recent" | "oldest" | "rating_desc" | "rating_asc";

type ListAdminReviewsInput = {
  page: number;
  limit: number;
  q?: string;
  productId?: string;
  status?: ReviewStatus | "all";
};

type ListMeReviewsInput = {
  page: number;
  limit: number;
};

type CreateMeReviewInput = {
  productId: string;
  rating: number;
  comment: string;
};

function toObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new ApiError(400, "Identificador invalido.");
  return new Types.ObjectId(value);
}

async function resolveProductIdentity(input: string): Promise<ProductIdentity> {
  const raw = String(input || "").trim();
  if (!raw) throw new ApiError(400, "Produto invalido.");

  const byId = Types.ObjectId.isValid(raw)
    ? await ProductModel.findById(raw).select("_id slug name")
    : null;

  const product = byId || (await ProductModel.findOne({ slug: raw }).select("_id slug name"));
  if (!product) throw new ApiError(404, "Produto nao encontrado.");

  return {
    id: String(product._id),
    slug: String(product.slug || ""),
    title: String(product.name || ""),
  };
}

function normalizeReviewSort(input?: string): StoreReviewSort {
  const value = String(input || "").trim().toLocaleLowerCase("pt-BR");
  if (value === "oldest") return "oldest";
  if (value === "rating_desc") return "rating_desc";
  if (value === "rating_asc") return "rating_asc";
  return "recent";
}

function getStoreSort(sort: StoreReviewSort): Record<string, 1 | -1> {
  if (sort === "oldest") return { createdAt: 1 as const };
  if (sort === "rating_desc") return { rating: -1 as const, createdAt: -1 as const };
  if (sort === "rating_asc") return { rating: 1 as const, createdAt: -1 as const };
  return { createdAt: -1 as const };
}

function toDistribution() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function toStoreReviewDTO(row: any): StoreReviewDTO {
  const customer = row.customerId as any;
  const customerName =
    String((row.customerName as string) || customer?.name || "").trim() || "Cliente";

  return {
    id: String(row._id),
    productId: String(row.productId),
    customerName,
    rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
    comment: String(row.comment || ""),
    verifiedPurchase: Boolean(row.verifiedPurchase),
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
  };
}

function toAdminReviewDTO(row: any): AdminReviewDTO {
  const product = row.productId as any;
  const customer = row.customerId as any;

  return {
    id: String(row._id),
    productId: String(product?._id || row.productId || ""),
    productSlug: String(product?.slug || row.productSlug || ""),
    productTitle: String(product?.name || row.productTitle || "Produto"),
    customerId: String(customer?._id || row.customerId || ""),
    customerName: String(customer?.name || row.customerName || "").trim() || "Cliente",
    customerEmail: String(customer?.email || row.customerEmail || "").trim().toLowerCase(),
    rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
    comment: String(row.comment || ""),
    status: (row.status as ReviewStatus) || "published",
    verifiedPurchase: Boolean(row.verifiedPurchase),
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

async function getPublishedSummaryByProductId(productId: string): Promise<ProductReviewSummary> {
  const target = toObjectId(productId);

  const [groupedByRating, totals] = await Promise.all([
    ReviewModel.aggregate([
      { $match: { productId: target, status: "published" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
    ReviewModel.aggregate([
      { $match: { productId: target, status: "published" } },
      { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: "$rating" } } },
    ]),
  ]);

  const distribution = toDistribution();
  for (const row of groupedByRating) {
    const rating = Number(row?._id || 0);
    if (rating >= 1 && rating <= 5) {
      distribution[rating as 1 | 2 | 3 | 4 | 5] = Math.max(0, Number(row.count || 0));
    }
  }

  const total = Number(totals?.[0]?.total || 0);
  const avgRaw = Number(totals?.[0]?.avg || 0);
  const avgRating = total > 0 ? Number(avgRaw.toFixed(1)) : 0;

  return { avgRating, total, distribution };
}

async function refreshProductReviewStats(productIdentity: ProductIdentity) {
  const summary = await getPublishedSummaryByProductId(productIdentity.id);

  await ProductModel.updateOne(
    { _id: toObjectId(productIdentity.id) },
    {
      reviewAverage: summary.avgRating,
      reviewCount: summary.total,
    },
  );

  await invalidateProductCacheByIdentity({
    id: productIdentity.id,
    slug: productIdentity.slug,
  });
}

export async function getProductReviewSummary(productInput: string) {
  const product = await resolveProductIdentity(productInput);
  const summary = await getPublishedSummaryByProductId(product.id);

  return {
    product,
    summary,
  };
}

export async function listPublishedProductReviews(input: {
  productId: string;
  page: number;
  limit: number;
  sort?: string;
}) {
  const product = await resolveProductIdentity(input.productId);
  const sort = normalizeReviewSort(input.sort);
  const query: FilterQuery<any> = {
    productId: toObjectId(product.id),
    status: "published",
  };

  const [rows, total] = await Promise.all([
    ReviewModel.find(query)
      .sort(getStoreSort(sort))
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    ReviewModel.countDocuments(query),
  ]);

  const customerIds = Array.from(new Set(rows.map((row) => String(row.customerId || "")).filter(Boolean)));
  const customerRows = customerIds.length
    ? await CustomerModel.find({ _id: { $in: customerIds } }).select("name")
    : [];
  const customerMap = new Map(customerRows.map((row: any) => [String(row._id), String(row.name || "")] as const));

  for (const row of rows) {
    (row as any).customerName = customerMap.get(String(row.customerId || "")) || "Cliente";
  }

  return {
    product,
    data: rows.map((row) => toStoreReviewDTO(row)),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function createMeReview(customerId: string, input: CreateMeReviewInput) {
  const product = await resolveProductIdentity(input.productId);
  const rating = Math.floor(Number(input.rating || 0));
  const comment = String(input.comment || "").trim();

  if (rating < 1 || rating > 5) throw new ApiError(400, "A nota deve estar entre 1 e 5.");
  if (comment.length < 5 || comment.length > 2000) {
    throw new ApiError(400, "Comentario deve ter entre 5 e 2000 caracteres.");
  }

  const customerObjectId = toObjectId(customerId);
  const productObjectId = toObjectId(product.id);

  const existing = await ReviewModel.findOne({
    productId: productObjectId,
    customerId: customerObjectId,
  });

  if (existing) {
    throw new ApiError(409, "Voce ja avaliou este produto.");
  }

  const verifiedPurchase = Boolean(
    await OrderModel.exists({
      customerId: customerObjectId,
      "items.productId": productObjectId,
      status: { $nin: ["cancelado", "reembolsado"] },
    }),
  );

  const created = await ReviewModel.create({
    productId: productObjectId,
    customerId: customerObjectId,
    rating,
    comment,
    verifiedPurchase,
    status: "published",
  });

  await refreshProductReviewStats(product);

  const customer = await CustomerModel.findById(customerObjectId).select("name");

  return {
    id: String(created._id),
    productId: product.id,
    customerName: String(customer?.name || "").trim() || "Cliente",
    rating: created.rating,
    comment: created.comment,
    verifiedPurchase: Boolean(created.verifiedPurchase),
    createdAt: created.createdAt?.toISOString() || new Date().toISOString(),
  };
}

export async function listAdminReviews(input: ListAdminReviewsInput) {
  const query: FilterQuery<any> = {};

  if (input.status && input.status !== "all") {
    query.status = input.status;
  }

  if (input.productId) {
    const product = await resolveProductIdentity(input.productId);
    query.productId = toObjectId(product.id);
  }

  if (input.q) {
    const regex = new RegExp(input.q, "i");

    const [customers, products] = await Promise.all([
      CustomerModel.find({ $or: [{ name: regex }, { email: regex }] }).select("_id").limit(100),
      ProductModel.find({ $or: [{ name: regex }, { slug: regex }] }).select("_id").limit(100),
    ]);

    query.$or = [
      { comment: regex },
      { customerId: { $in: customers.map((row) => row._id) } },
      { productId: { $in: products.map((row) => row._id) } },
    ];
  }

  const [rows, total] = await Promise.all([
    ReviewModel.find(query)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    ReviewModel.countDocuments(query),
  ]);

  const productIds = Array.from(new Set(rows.map((row) => String(row.productId || "")).filter(Boolean)));
  const customerIds = Array.from(new Set(rows.map((row) => String(row.customerId || "")).filter(Boolean)));

  const [products, customers] = await Promise.all([
    productIds.length ? ProductModel.find({ _id: { $in: productIds } }).select("name slug") : [],
    customerIds.length ? CustomerModel.find({ _id: { $in: customerIds } }).select("name email") : [],
  ]);

  const productMap = new Map(products.map((row: any) => [String(row._id), row] as const));
  const customerMap = new Map(customers.map((row: any) => [String(row._id), row] as const));

  for (const row of rows) {
    const product = productMap.get(String(row.productId || ""));
    const customer = customerMap.get(String(row.customerId || ""));
    (row as any).productTitle = String(product?.name || "Produto");
    (row as any).productSlug = String(product?.slug || "");
    (row as any).customerName = String(customer?.name || "Cliente");
    (row as any).customerEmail = String(customer?.email || "");
  }

  return {
    data: rows.map((row) => toAdminReviewDTO(row)),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function listMeReviews(customerId: string, input: ListMeReviewsInput) {
  const customerObjectId = toObjectId(customerId);
  const query: FilterQuery<any> = { customerId: customerObjectId };

  const [rows, total] = await Promise.all([
    ReviewModel.find(query)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    ReviewModel.countDocuments(query),
  ]);

  const productIds = Array.from(new Set(rows.map((row) => String(row.productId || "")).filter(Boolean)));
  const products = productIds.length ? await ProductModel.find({ _id: { $in: productIds } }).select("name slug") : [];
  const productMap = new Map(products.map((row: any) => [String(row._id), row] as const));

  return {
    data: rows.map((row) => {
      const product = productMap.get(String(row.productId || ""));
      return {
        id: String(row._id),
        productId: String(row.productId || ""),
        productSlug: String(product?.slug || ""),
        productTitle: String(product?.name || "Produto"),
        rating: Math.max(1, Math.min(5, Number(row.rating || 0))),
        comment: String(row.comment || ""),
        status: (row.status as ReviewStatus) || "published",
        verifiedPurchase: Boolean(row.verifiedPurchase),
        createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
      };
    }),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function patchAdminReviewStatus(reviewId: string, status: ReviewStatus) {
  if (!Types.ObjectId.isValid(reviewId)) throw new ApiError(400, "Avaliacao invalida.");

  const review = await ReviewModel.findById(reviewId);
  if (!review) throw new ApiError(404, "Avaliacao nao encontrada.");

  review.status = status;
  await review.save();

  const product = await ProductModel.findById(String(review.productId || ""));
  if (product?._id) {
    await refreshProductReviewStats({
      id: String(product._id),
      slug: String(product.slug || ""),
      title: String(product.name || ""),
    });
  }

  const refreshed = await ReviewModel.findById(review._id);
  if (!refreshed) throw new ApiError(404, "Avaliacao nao encontrada.");

  const [refreshedProduct, refreshedCustomer] = await Promise.all([
    ProductModel.findById(String(refreshed.productId || "")).select("name slug"),
    CustomerModel.findById(String(refreshed.customerId || "")).select("name email"),
  ]);

  (refreshed as any).productTitle = String((refreshedProduct as any)?.name || "Produto");
  (refreshed as any).productSlug = String((refreshedProduct as any)?.slug || "");
  (refreshed as any).customerName = String((refreshedCustomer as any)?.name || "Cliente");
  (refreshed as any).customerEmail = String((refreshedCustomer as any)?.email || "");

  return toAdminReviewDTO(refreshed);
}

export async function deleteAdminReview(reviewId: string) {
  if (!Types.ObjectId.isValid(reviewId)) throw new ApiError(400, "Avaliacao invalida.");

  const review = await ReviewModel.findById(reviewId);
  if (!review) throw new ApiError(404, "Avaliacao nao encontrada.");

  const product = await ProductModel.findById(String(review.productId || ""));
  await review.deleteOne();

  if (product?._id) {
    await refreshProductReviewStats({
      id: String(product._id),
      slug: String(product.slug || ""),
      title: String(product.name || ""),
    });
  }

  return { id: reviewId };
}

