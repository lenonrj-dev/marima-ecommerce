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

export type ProductReview = {
  id: string;
  name: string;
  verified?: boolean;
  timeAgo: string;
  title: string;
  rating: number;
  text: string;
  avatar: string;
  media: string[];
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

export function formatCategoryLabel(value: string) {
  const key = String(value || "").trim().toLocaleLowerCase("pt-BR");

  if (key === "fitness") return "Fitness";
  if (key === "moda") return "Moda";
  if (key === "casual") return "Casual";
  if (key === "acessorios") return "Casual";
  if (key === "suplementos") return "Suplementos";
  if (key === "outros") return "Outros";

  return value;
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

export function normalizeProductFromApi(product: Partial<Product>): Product {
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

  return {
    id: String(product.id || ""),
    slug: String(product.slug || ""),
    title,
    price: Number(product.price || 0),
    compareAtPrice: typeof product.compareAtPrice === "number" ? Number(product.compareAtPrice) : undefined,
    image,
    category: String(product.category || "outros"),
    groupKey: groupKey || undefined,
    colorName: colorName || undefined,
    colorHex: colorHex || undefined,
    colorVariants,
    tags,
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
    variants: Array.isArray(product.variants) ? product.variants : [],
    badge: product.badge,
    description: String(product.description || product.longDescription || "Sem descrição."),
    longDescription: String(product.longDescription || product.description || "Sem descrição."),
    rating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : 4.7,
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
      data: (response.data || []).map((item) => normalizeProductFromApi(item)),
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
    return response.data || [];
  } catch {
    return [];
  }
}
