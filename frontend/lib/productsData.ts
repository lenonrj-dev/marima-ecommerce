import { apiFetch, type ApiListResponse, HttpError } from "@/lib/api";

const PRODUCT_FALLBACK_IMAGE =
  "https://res.cloudinary.com/dxeooztro/image/upload/v1764855923/products/wm3vuf0hbfpmvf92ofma.png";

const PRODUCT_BANNER_IMAGE =
  "https://res.cloudinary.com/dpyrbbvjd/image/upload/v1768760004/AthleisureBanner_dzhuwp.png";

export type ProductVariant = {
  id: string;
  color: string;
  size: string;
  stock: number;
};

export type ProductSizeType = "roupas" | "numerico" | "unico" | "custom";

export type ProductSizeRow = {
  label: string;
  stock: number;
};

export type ProductColorVariant = {
  id: string;
  slug: string;
  colorName?: string;
  colorHex?: string;
  active?: boolean;
  totalStock: number;
  isAvailable: boolean;
};

export type ProductColorVariantsResponse = {
  groupKey: string;
  current: ProductColorVariant;
  variants: ProductColorVariant[];
};

export type ProductAdditionalInfoItem = {
  label: string;
  value: string;
};

export type ProductReview = {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
};

export type ProductReviewSummary = {
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

export type ProductReviewSort = "recent" | "oldest" | "rating_desc" | "rating_asc";

export type ProductReviewCreateInput = {
  productId: string;
  rating: number;
  comment: string;
};

export type MeProductReview = {
  id: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  rating: number;
  comment: string;
  status: "published" | "pending" | "hidden";
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: string;
  groupKey?: string;
  colorName?: string;
  colorHex?: string;
  colorVariants?: ProductColorVariant[];
  tags?: string[];
  stock: number;
  variants?: ProductVariant[];
  badge?: "Novo" | "Oferta" | "Destaque";
  description: string;
  longDescription: string;
  additionalInfo: ProductAdditionalInfoItem[];
  rating: number;
  reviewCount: number;
  colors: Array<{ name: string; hex: string }>;
  sizes: string[];
  sizeType?: ProductSizeType;
  sizesDetailed?: ProductSizeRow[];
  gallery: Array<{ src: string; alt: string }>;
  reviews: ProductReview[];
};

export type ProductListItem = Product;

export type ProductSearchFilters = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sort?: "featured" | "price_asc" | "price_desc" | "rating_desc" | "newest";
};

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

export type CategoryFacet = {
  key: string;
  slug: string;
  label: string;
  count: number;
};

type ProductCategorySource = Partial<Product> & {
  category?: unknown;
  categoryId?: unknown;
  categorySlug?: unknown;
  categoryName?: unknown;
  categoryRef?: {
    id?: unknown;
    slug?: unknown;
    name?: unknown;
  } | null;
};

const CATEGORY_ALIASES: Record<string, string> = {
  acessorio: "casual",
  acessorios: "casual",
  "acessorios-e-complementos": "casual",
};

const BASE_COLORS = [
  { name: "Preto", hex: "#111111" },
  { name: "Grafite", hex: "#3f3f46" },
  { name: "Azul petróleo", hex: "#164e63" },
  { name: "Areia", hex: "#d6d3d1" },
] as const;

export const productListBanner = {
  eyebrow: "Coleções Marima",
  title: "Moda Fitness & Casual para performance e conforto",
  description:
    "Explore peças com tecido tecnológico, respirabilidade e compressão para treinar com segurança e estilo.",
  image: PRODUCT_BANNER_IMAGE,
};

export function formatMoneyBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function normalizeCategoryKey(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+/g, "-");

  if (!normalized) return "";
  return CATEGORY_ALIASES[normalized] ?? normalized;
}

function toTitleCaseWords(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1))
    .join(" ");
}

export function formatCategoryLabel(value: string) {
  const key = normalizeCategoryKey(value);
  if (!key) return String(value || "");

  if (key === "fitness") return "Fitness";
  if (key === "moda") return "Moda";
  if (key === "casual") return "Casual";
  if (key === "suplementos") return "Suplementos";
  if (key === "outros") return "Outros";

  return toTitleCaseWords(key.replace(/-/g, " "));
}

export function resolveProductCategory(
  product: ProductCategorySource,
  options?: {
    categoriesById?: Map<string, StoreCategory>;
    categoriesByKey?: Map<string, StoreCategory>;
  },
): { key: string; label: string } | null {
  const categoryId = typeof product.categoryId === "string" ? product.categoryId.trim() : "";
  const fromId = categoryId ? options?.categoriesById?.get(categoryId) : undefined;

  const categoryRef =
    product.categoryRef && typeof product.categoryRef === "object" ? product.categoryRef : undefined;
  const fromCategoryRefSlug =
    categoryRef && typeof categoryRef.slug === "string" ? categoryRef.slug.trim() : "";
  const fromCategoryRefName =
    categoryRef && typeof categoryRef.name === "string" ? categoryRef.name.trim() : "";

  const fromCategorySlug = typeof product.categorySlug === "string" ? product.categorySlug.trim() : "";
  const fromCategoryName = typeof product.categoryName === "string" ? product.categoryName.trim() : "";
  const fromCategory = typeof product.category === "string" ? product.category.trim() : "";

  const keyCandidates = [
    fromCategoryRefSlug,
    fromCategorySlug,
    fromId?.slug || "",
    fromCategory,
    fromCategoryRefName,
    fromCategoryName,
    fromId?.name || "",
  ];

  let key = "";
  for (const candidate of keyCandidates) {
    key = normalizeCategoryKey(candidate);
    if (key) break;
  }
  if (!key) return null;

  const mappedCategory = options?.categoriesByKey?.get(key);
  const mappedLabel = mappedCategory?.name?.trim();
  const labelCandidates = [mappedLabel, fromCategoryRefName, fromCategoryName, fromCategory];
  const label = labelCandidates.find((candidate) => {
    if (!candidate) return false;
    return normalizeCategoryKey(candidate) === key;
  });

  return {
    key,
    label: label?.trim() || formatCategoryLabel(key),
  };
}

export function buildCategoryFacets(input: {
  products: ProductCategorySource[];
  categories?: StoreCategory[];
}): CategoryFacet[] {
  const categories = input.categories ?? [];
  const categoriesById = new Map<string, StoreCategory>();
  const categoriesByKey = new Map<string, StoreCategory>();
  const categoryOrder = new Map<string, number>();

  for (const [index, category] of categories.entries()) {
    const key = normalizeCategoryKey(category.slug || category.name);
    if (!key) continue;
    categoriesById.set(String(category.id), category);
    if (!categoriesByKey.has(key)) categoriesByKey.set(key, category);
    if (!categoryOrder.has(key)) categoryOrder.set(key, index);
  }

  const countMap = new Map<string, number>();
  const labelMap = new Map<string, string>();

  for (const product of input.products) {
    const resolved = resolveProductCategory(product, { categoriesById, categoriesByKey });
    if (!resolved) continue;

    countMap.set(resolved.key, (countMap.get(resolved.key) ?? 0) + 1);
    if (!labelMap.has(resolved.key)) labelMap.set(resolved.key, resolved.label);
  }

  const facets: CategoryFacet[] = [];
  for (const [key, count] of countMap.entries()) {
    if (count <= 0) continue;
    facets.push({
      key,
      slug: key,
      label: labelMap.get(key) || categoriesByKey.get(key)?.name || formatCategoryLabel(key),
      count,
    });
  }

  facets.sort((a, b) => {
    const orderA = categoryOrder.get(a.key);
    const orderB = categoryOrder.get(b.key);
    if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
    if (orderA !== undefined) return -1;
    if (orderB !== undefined) return 1;
    return a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" });
  });

  return facets;
}

export function formatIDR(value: number) {
  return formatMoneyBRL(value);
}

export function formatUSD(value: number) {
  return formatMoneyBRL(value);
}

function normalizeGallery(product: Partial<Product>) {
  if (Array.isArray(product.gallery) && product.gallery.length > 0) {
    return product.gallery.map((item, index) => ({
      src: item?.src || PRODUCT_FALLBACK_IMAGE,
      alt: item?.alt || `${product.title || "Produto"} - foto ${index + 1}`,
    }));
  }

  return [{ src: product.image || PRODUCT_FALLBACK_IMAGE, alt: `${product.title || "Produto"} - foto 1` }];
}

export function normalizeProductFromApi(
  product: ProductCategorySource,
  options?: { categoriesById?: Map<string, StoreCategory>; categoriesByKey?: Map<string, StoreCategory> },
): Product {
  const title = product.title?.trim() || "Produto";
  const image = product.image?.trim() || PRODUCT_FALLBACK_IMAGE;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const groupKey = typeof product.groupKey === "string" ? product.groupKey.trim() : "";
  const colorName = typeof product.colorName === "string" ? product.colorName.trim() : "";
  const colorHex = typeof product.colorHex === "string" ? product.colorHex.trim() : "";
  const colorVariants = Array.isArray(product.colorVariants)
    ? product.colorVariants
        .map((variant) => ({
          id: String((variant as Partial<ProductColorVariant>)?.id || ""),
          slug: String((variant as Partial<ProductColorVariant>)?.slug || ""),
          colorName:
            typeof (variant as Partial<ProductColorVariant>)?.colorName === "string"
              ? String((variant as Partial<ProductColorVariant>)?.colorName).trim()
              : undefined,
          colorHex:
            typeof (variant as Partial<ProductColorVariant>)?.colorHex === "string"
              ? String((variant as Partial<ProductColorVariant>)?.colorHex).trim()
              : undefined,
          active: (variant as Partial<ProductColorVariant>)?.active === undefined ? undefined : Boolean((variant as Partial<ProductColorVariant>)?.active),
          totalStock: Math.max(0, Math.floor(Number((variant as Partial<ProductColorVariant>)?.totalStock ?? 0))),
          isAvailable: Boolean((variant as Partial<ProductColorVariant>)?.isAvailable),
        }))
        .filter((variant) => variant.id && variant.slug)
    : [];
  const sizeType =
    product.sizeType === "roupas" || product.sizeType === "numerico" || product.sizeType === "unico" || product.sizeType === "custom"
      ? product.sizeType
      : undefined;
  const sizesDetailed = Array.isArray(product.sizesDetailed)
    ? product.sizesDetailed
        .map((row) => ({
          label: String(row?.label || "").trim(),
          stock: Math.max(0, Math.floor(Number(row?.stock ?? 0))),
        }))
        .filter((row) => row.label)
    : [];
  const sizes = sizesDetailed.length
    ? sizesDetailed.map((row) => row.label)
    : Array.isArray(product.sizes) && product.sizes.length
      ? product.sizes
      : [];
  const additionalInfo = Array.isArray(product.additionalInfo)
    ? product.additionalInfo
        .map((item) => ({
          label: String((item as Partial<ProductAdditionalInfoItem>)?.label || "").trim(),
          value: String((item as Partial<ProductAdditionalInfoItem>)?.value || "").trim(),
        }))
        .filter((item) => item.label && item.value)
    : [];

  const resolvedCategory = resolveProductCategory(product, {
    categoriesById: options?.categoriesById,
    categoriesByKey: options?.categoriesByKey,
  });

  return {
    id: String(product.id || ""),
    slug: String(product.slug || ""),
    title,
    price: Number(product.price || 0),
    compareAtPrice: typeof product.compareAtPrice === "number" ? Number(product.compareAtPrice) : undefined,
    image,
    category: resolvedCategory?.key || "outros",
    groupKey: groupKey || undefined,
    colorName: colorName || undefined,
    colorHex: colorHex || undefined,
    colorVariants,
    tags,
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
    variants: Array.isArray(product.variants) ? product.variants : [],
    badge: product.badge,
    additionalInfo,
    description: String(product.description || product.longDescription || "Sem descrição."),
    longDescription: String(product.longDescription || product.description || "Sem descrição."),
    rating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : 0,
    reviewCount: Number.isFinite(Number(product.reviewCount)) ? Number(product.reviewCount) : 0,
    colors: Array.isArray(product.colors) && product.colors.length ? product.colors : [...BASE_COLORS],
    sizes,
    sizeType: sizeType ?? (sizesDetailed.length ? "custom" : "unico"),
    sizesDetailed,
    gallery: normalizeGallery(product),
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
  };
}

export async function fetchStoreProducts(
  query?: Partial<{
    q: string;
    category: string;
    status: string;
    active: boolean;
    sort: ProductSearchFilters["sort"];
    page: number;
    limit: number;
    maxPrice: number;
    includeVariants: boolean;
  }>,
) {
  try {
    const response = await apiFetch<ApiListResponse<Partial<Product>>>("/api/v1/store/products", {
      query: {
        q: query?.q,
        category: query?.category,
        status: query?.status,
        active: query?.active,
        sort: query?.sort,
        page: query?.page,
        limit: query?.limit,
        maxPrice: query?.maxPrice,
        includeVariants: query?.includeVariants,
      },
    });

    return {
      data: (response.data || []).map((item) => normalizeProductFromApi(item as ProductCategorySource)),
      meta: response.meta,
    };
  } catch {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 0;
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        pages: 1,
      },
    };
  }
}

export async function fetchStoreProductsForFacets(
  query?: Partial<{
    q: string;
    status: string;
    active: boolean;
    maxPrice: number;
  }>,
) {
  const limit = 100;
  const maxPages = 20;
  const all: Product[] = [];
  let page = 1;
  let pages = 1;

  while (page <= pages && page <= maxPages) {
    const response = await fetchStoreProducts({
      q: query?.q,
      status: query?.status,
      active: query?.active,
      maxPrice: query?.maxPrice,
      page,
      limit,
      includeVariants: false,
    });

    all.push(...response.data);

    const nextPages = Math.max(1, Number(response.meta?.pages || 1));
    pages = Math.min(nextPages, maxPages);
    if (response.data.length === 0) break;
    page += 1;
  }

  return all;
}

export async function fetchStoreProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await apiFetch<{ data: Partial<Product> }>(`/api/v1/store/products/${encodeURIComponent(slug)}`);
    return normalizeProductFromApi(response.data);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    throw err;
  }
}

function normalizeColorVariantFromApi(input: Partial<ProductColorVariant> | undefined): ProductColorVariant | null {
  if (!input) return null;
  const id = String(input.id || "").trim();
  const slug = String(input.slug || "").trim();
  if (!id || !slug) return null;

  return {
    id,
    slug,
    colorName: typeof input.colorName === "string" ? input.colorName.trim() || undefined : undefined,
    colorHex: typeof input.colorHex === "string" ? input.colorHex.trim() || undefined : undefined,
    active: input.active === undefined ? undefined : Boolean(input.active),
    totalStock: Math.max(0, Math.floor(Number(input.totalStock ?? 0))),
    isAvailable: Boolean(input.isAvailable),
  };
}

export async function fetchStoreProductVariantsBySlug(slug: string): Promise<ProductColorVariantsResponse | null> {
  try {
    const response = await apiFetch<{ data: ProductColorVariantsResponse }>(
      `/api/v1/store/products/${encodeURIComponent(slug)}/variants`,
    );

    const data = response.data;
    const groupKey = String(data?.groupKey || "").trim();
    const current = normalizeColorVariantFromApi(data?.current);
    const variants = Array.isArray(data?.variants)
      ? data.variants
          .map((item) => normalizeColorVariantFromApi(item))
          .filter((item): item is ProductColorVariant => Boolean(item))
      : [];

    if (!groupKey || !current) return null;

    return { groupKey, current, variants };
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    return null;
  }
}

export async function fetchStoreCategories(): Promise<StoreCategory[]> {
  try {
    const response = await apiFetch<{ data: StoreCategory[] }>("/api/v1/store/categories");
    const rows = Array.isArray(response.data) ? response.data : [];
    const byKey = new Map<string, StoreCategory>();

    for (const row of rows) {
      const key = normalizeCategoryKey(row.slug || row.name);
      if (!key) continue;
      if (byKey.has(key)) continue;
      byKey.set(key, {
        id: String(row.id || key),
        name: String(row.name || formatCategoryLabel(key)),
        slug: key,
        productCount:
          typeof row.productCount === "number" && Number.isFinite(row.productCount)
            ? Math.max(0, Math.floor(row.productCount))
            : undefined,
      });
    }

    return Array.from(byKey.values());
  } catch {
    return [];
  }
}

export async function fetchProductReviews(
  productId: string,
  query?: Partial<{ page: number; limit: number; sort: ProductReviewSort }>,
) {
  const response = await apiFetch<ApiListResponse<ProductReview>>(
    `/api/v1/store/products/${encodeURIComponent(productId)}/reviews`,
    {
      query: {
        page: query?.page,
        limit: query?.limit,
        sort: query?.sort,
      },
    },
  );

  return {
    data: response.data || [],
    meta: response.meta,
  };
}

export async function fetchProductReviewsSummary(productId: string): Promise<ProductReviewSummary> {
  const response = await apiFetch<{ data: ProductReviewSummary }>(
    `/api/v1/store/products/${encodeURIComponent(productId)}/reviews/summary`,
  );

  return response.data;
}

export async function createProductReview(input: ProductReviewCreateInput): Promise<ProductReview> {
  const response = await apiFetch<{ data: ProductReview }>("/api/v1/me/reviews", {
    method: "POST",
    body: JSON.stringify({
      productId: input.productId,
      rating: input.rating,
      comment: input.comment.trim(),
    }),
  });

  return response.data;
}

export async function fetchMeProductReviews(query?: Partial<{ page: number; limit: number }>) {
  const response = await apiFetch<ApiListResponse<MeProductReview>>("/api/v1/me/reviews", {
    query: {
      page: query?.page,
      limit: query?.limit,
    },
    skipAuthRedirect: true,
  });

  return {
    data: response.data || [],
    meta: response.meta,
  };
}
