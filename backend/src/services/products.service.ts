import { prisma } from "../lib/prisma";
import { bumpCacheVersion, delCache, getCacheVersion, getOrSetCache, hashCacheQuery } from "../lib/cache";
import { ApiError } from "../utils/apiError";
import { normalizeColorVariantInput } from "../utils/colorVariants";
import { fromCents, toCents } from "../utils/money";
import { slugify } from "../utils/slug";
import { buildMeta } from "../utils/pagination";

type ProductStatus = "padrao" | "novo" | "destaque" | "oferta";
type ProductSizeType = "roupas" | "numerico" | "unico" | "custom";

type ProductSizeRow = {
  label: string;
  stock: number;
  sku?: string;
  active?: boolean;
};

type ProductAdditionalInfoRow = {
  label: string;
  value: string;
};

function statusToBadge(status: ProductStatus) {
  if (status === "novo") return "Novo";
  if (status === "destaque") return "Destaque";
  if (status === "oferta") return "Oferta";
  return undefined;
}

function canonicalCategory(value: unknown) {
  const key = String(value || "").trim().toLocaleLowerCase("pt-BR");
  if (key === "acessorios" || key === "acessórios") return "casual";
  return key || "outros";
}

const PRODUCTS_LIST_VERSION_KEY = "cache:v1:products:listVersion";
const PRODUCTS_LIST_TTL_SECONDS = 60;
const PRODUCT_ITEM_TTL_SECONDS = 60 * 15;
const PRODUCT_STOCK_TTL_SECONDS = 20;

function normalizeSizes(input: unknown): ProductSizeRow[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  const rows: ProductSizeRow[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Partial<ProductSizeRow>;

    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!label) continue;

    const key = label.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;

    const stock = Math.max(0, Math.floor(Number(item.stock ?? 0)));
    const sku = typeof item.sku === "string" && item.sku.trim() ? item.sku.trim().toUpperCase() : undefined;
    const active = item.active === undefined ? true : Boolean(item.active);

    rows.push({ label, stock, sku, active });
    seen.add(key);
  }

  return rows;
}

function sumActiveSizeStock(sizes: ProductSizeRow[]) {
  return sizes.reduce((acc, item) => acc + (item.active === false ? 0 : Math.max(0, Math.floor(item.stock))), 0);
}

function normalizeAdditionalInfo(input: unknown): ProductAdditionalInfoRow[] {
  if (!Array.isArray(input)) return [];

  const rows: ProductAdditionalInfoRow[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Partial<ProductAdditionalInfoRow>;

    const label = typeof item.label === "string" ? item.label.trim() : "";
    const value = typeof item.value === "string" ? item.value.trim() : "";

    if (!label || !value) continue;

    const dedupeKey = `${label.toLocaleLowerCase("pt-BR")}::${value.toLocaleLowerCase("pt-BR")}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    rows.push({ label, value });
  }

  return rows;
}

function inferSizeType(product: any): ProductSizeType {
  const explicit = product.sizeType as ProductSizeType | undefined;
  if (explicit === "roupas" || explicit === "numerico" || explicit === "unico" || explicit === "custom") {
    return explicit;
  }

  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  return hasSizes ? "custom" : "unico";
}

function toAdmin(product: any) {
  const sizeType = inferSizeType(product);
  const sizes = normalizeSizes(product.sizes);
  const totalStock = sizes.length ? sumActiveSizeStock(sizes) : product.stock;
  const additionalInfo = normalizeAdditionalInfo(product.additionalInfo);

  return {
    id: String(product.id),
    name: product.name,
    sku: product.sku,
    groupKey: product.groupKey || undefined,
    colorName: product.colorName || undefined,
    colorHex: product.colorHex || undefined,
    category: canonicalCategory(product.category),
    size: product.size,
    sizeType,
    sizes,
    stock: Math.max(0, Math.floor(Number(totalStock ?? 0))),
    price: fromCents(product.priceCents),
    compareAtPrice: product.compareAtPriceCents ? fromCents(product.compareAtPriceCents) : undefined,
    shortDescription: product.shortDescription,
    description: product.description,
    additionalInfo,
    tags: Array.isArray(product.tags) ? product.tags : [],
    status: product.status,
    active: product.active,
    images: Array.isArray(product.images) ? product.images : [],
    updatedAt: product.updatedAt?.toISOString(),
    slug: product.slug,
    createdAt: product.createdAt?.toISOString(),
  };
}

function toStore(product: any) {
  const sizeType = inferSizeType(product);
  const sizes = normalizeSizes(product.sizes).filter((row) => row.active !== false);
  const sizesDetailed = sizeType !== "unico" && sizes.length ? sizes.map((row) => ({ label: row.label, stock: row.stock })) : [];
  const totalStock = sizesDetailed.length ? sizesDetailed.reduce((acc, row) => acc + Math.max(0, Math.floor(row.stock)), 0) : product.stock;
  const rating = Math.max(0, Math.min(5, Number(product.reviewAverage ?? 0)));
  const reviewCount = Math.max(0, Math.floor(Number(product.reviewCount ?? 0)));

  const rawImages = Array.isArray(product.images) ? product.images : [];
  const gallery = rawImages.map((src: string, index: number) => ({ src, alt: `${product.name} ${index + 1}` }));
  return {
    id: String(product.id),
    slug: product.slug,
    title: product.name,
    price: fromCents(product.priceCents),
    compareAtPrice: product.compareAtPriceCents ? fromCents(product.compareAtPriceCents) : undefined,
    image: rawImages[0] || "",
    category: canonicalCategory(product.category),
    groupKey: product.groupKey || undefined,
    colorName: product.colorName || undefined,
    colorHex: product.colorHex || undefined,
    tags: Array.isArray(product.tags) ? product.tags : [],
    stock: Math.max(0, Math.floor(Number(totalStock ?? 0))),
    variants: [],
    badge: statusToBadge(product.status),
    description: product.shortDescription,
    longDescription: product.description,
    additionalInfo: normalizeAdditionalInfo(product.additionalInfo),
    rating,
    reviewCount,
    colors: [
      { name: "Preto", hex: "#111111" },
      { name: "Grafite", hex: "#3f3f46" },
    ],
    sizeType,
    sizes: sizesDetailed.map((row) => row.label),
    sizesDetailed,
    gallery,
    reviews: [],
  };
}

type ProductStockSnapshot = {
  stock: number;
  sizes: string[];
  sizesDetailed: Array<{ label: string; stock: number }>;
};

function buildStockSnapshot(product: any): ProductStockSnapshot {
  const sizeType = inferSizeType(product);
  const sizes = normalizeSizes(product.sizes).filter((row) => row.active !== false);
  const sizesDetailed = sizeType !== "unico" && sizes.length ? sizes.map((row) => ({ label: row.label, stock: row.stock })) : [];
  const stock = sizesDetailed.length
    ? sizesDetailed.reduce((acc, row) => acc + Math.max(0, Math.floor(row.stock)), 0)
    : Math.max(0, Math.floor(Number(product.stock ?? 0)));

  return {
    stock,
    sizes: sizesDetailed.map((row) => row.label),
    sizesDetailed,
  };
}

function mergeStoreProductStock<T extends { stock: number; sizes: string[]; sizesDetailed: Array<{ label: string; stock: number }> }>(
  product: T,
  snapshot: ProductStockSnapshot,
) {
  return {
    ...product,
    stock: snapshot.stock,
    sizes: snapshot.sizes,
    sizesDetailed: snapshot.sizesDetailed,
  };
}

async function getCachedStockByProductId(productId: string) {
  const key = `cache:v1:stock:${productId}`;
  return getOrSetCache(key, PRODUCT_STOCK_TTL_SECONDS, async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, sizes: true, sizeType: true, active: true },
    });
    if (!product || !product.active) {
      return { stock: 0, sizes: [], sizesDetailed: [] } as ProductStockSnapshot;
    }

    return buildStockSnapshot(product);
  });
}

export async function bumpProductsListVersion() {
  await bumpCacheVersion(PRODUCTS_LIST_VERSION_KEY);
}

export async function invalidateProductCacheByIdentity(input: {
  id: string;
  slug?: string;
  previousSlug?: string;
  bumpListVersion?: boolean;
}) {
  if (input.bumpListVersion !== false) {
    await bumpProductsListVersion();
  }

  const keys = new Set<string>([
    `cache:v1:stock:${input.id}`,
    `cache:v1:products:item:${input.id}`,
  ]);

  if (input.slug) {
    keys.add(`cache:v1:products:item:${input.slug}`);
    keys.add(`cache:v1:products:item:${input.slug}:variants`);
  }

  if (input.previousSlug) {
    keys.add(`cache:v1:products:item:${input.previousSlug}`);
    keys.add(`cache:v1:products:item:${input.previousSlug}:variants`);
  }

  await Promise.all(Array.from(keys).map((key) => delCache(key)));
}

export async function listAdminProducts(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  groupKey?: string;
  status?: string;
  active?: boolean;
  sort?: string;
}) {
  const where: any = {};

  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { sku: { contains: input.q, mode: "insensitive" } },
      { shortDescription: { contains: input.q, mode: "insensitive" } },
    ];
  }

  if (input.category) {
    const key = canonicalCategory(input.category);
    if (key === "casual") {
      where.category = { in: ["casual", "acessorios"] };
    } else {
      where.category = input.category;
    }
  }

  if (input.groupKey) {
    where.groupKey = slugify(String(input.groupKey || "").trim());
  }
  if (input.status && input.status !== "all") where.status = input.status;
  if (typeof input.active === "boolean") where.active = input.active;

  const sort = input.sort || "-updatedAt";
  let orderBy: any = { updatedAt: "desc" };
  if (sort === "price_asc") orderBy = { priceCents: "asc" };
  if (sort === "price_desc") orderBy = { priceCents: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: rows.map(toAdmin),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Produto não encontrado.");
  return toAdmin(product);
}

export async function createProduct(input: {
  name: string;
  sku: string;
  groupKey?: string;
  colorName?: string;
  colorHex?: string;
  category: string;
  size?: string;
  sizeType?: ProductSizeType;
  sizes?: ProductSizeRow[];
  stock: number;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  additionalInfo?: ProductAdditionalInfoRow[];
  tags?: string[];
  status: ProductStatus;
  active: boolean;
  images: string[];
}) {
  const sku = input.sku.trim().toUpperCase();
  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) throw new ApiError(409, "SKU já existente.");

  const slug = slugify(`${input.name}-${sku}`);

  const normalizedSizes = normalizeSizes(input.sizes);
  const explicitSizeType = input.sizeType;
  const nextSizeType =
    explicitSizeType === "roupas" || explicitSizeType === "numerico" || explicitSizeType === "unico" || explicitSizeType === "custom"
      ? explicitSizeType
      : normalizedSizes.length
        ? "custom"
        : "unico";

  if (nextSizeType !== "unico" && !normalizedSizes.length) {
    throw new ApiError(400, "Informe ao menos um tamanho.");
  }

  const usesSizes = nextSizeType !== "unico" && normalizedSizes.length > 0;
  const totalStock = usesSizes ? sumActiveSizeStock(normalizedSizes) : Math.max(0, Math.floor(input.stock));
  const sizeText = usesSizes ? normalizedSizes.map((row) => row.label).join(", ") : input.size?.trim() || undefined;

  const normalizedColors = normalizeColorVariantInput({
    groupKey: input.groupKey,
    colorName: input.colorName,
    colorHex: input.colorHex,
    productName: input.name,
    category: input.category,
  });

  const created = await prisma.product.create({
    data: {
      name: input.name.trim(),
      slug,
      sku,
      groupKey: normalizedColors.groupKey,
      colorName: normalizedColors.colorName,
      colorHex: normalizedColors.colorHex,
      category: canonicalCategory(input.category),
      size: sizeText,
      sizeType: nextSizeType,
      sizes: usesSizes ? (normalizedSizes as any) : ([] as any),
      stock: totalStock,
      priceCents: toCents(input.price),
      compareAtPriceCents:
        input.compareAtPrice !== undefined && input.compareAtPrice > 0 ? toCents(input.compareAtPrice) : undefined,
      shortDescription: input.shortDescription.trim(),
      description: input.description.trim(),
      additionalInfo: normalizeAdditionalInfo(input.additionalInfo) as any,
      tags: (input.tags || []) as any,
      status: input.status,
      active: input.active,
      images: input.images as any,
    },
  });

  await invalidateProductCacheByIdentity({
    id: String(created.id),
    slug: created.slug,
  });

  return toAdmin(created);
}

export async function updateProduct(
  id: string,
  input: Partial<{
    name: string;
    sku: string;
    groupKey?: string;
    colorName?: string;
    colorHex?: string;
    category: string;
    size?: string;
    sizeType?: ProductSizeType;
    sizes?: ProductSizeRow[];
    stock: number;
    price: number;
    compareAtPrice?: number;
    shortDescription: string;
    description: string;
    additionalInfo: ProductAdditionalInfoRow[];
    tags: string[];
    status: ProductStatus;
    active: boolean;
    images: string[];
  }>,
) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Produto não encontrado.");
  const previousSlug = String(product.slug || "");

  const current: any = {
    ...product,
    sizes: normalizeSizes(product.sizes),
  };

  if (input.name !== undefined) current.name = input.name.trim();
  if (input.sku !== undefined) current.sku = input.sku.trim().toUpperCase();
  if (input.category !== undefined) current.category = canonicalCategory(input.category);

  const normalizedColors = normalizeColorVariantInput({
    groupKey: input.groupKey,
    colorName: input.colorName,
    colorHex: input.colorHex,
    productName: current.name,
    category: current.category,
  });

  if (input.groupKey !== undefined) current.groupKey = normalizedColors.groupKey;
  if (input.colorName !== undefined) current.colorName = normalizedColors.colorName;
  if (input.colorHex !== undefined) current.colorHex = normalizedColors.colorHex;

  if (
    input.groupKey === undefined &&
    input.colorName === undefined &&
    input.colorHex === undefined &&
    !current.groupKey &&
    !current.colorName &&
    normalizedColors.inferred?.groupKey &&
    normalizedColors.inferred?.colorName
  ) {
    current.groupKey = normalizedColors.inferred.groupKey;
    current.colorName = normalizedColors.inferred.colorName;
    current.colorHex = normalizedColors.inferred.colorHex;
  }

  const explicitSizeType = input.sizeType;
  const sizesInput = input.sizes !== undefined ? normalizeSizes(input.sizes) : undefined;

  if (explicitSizeType !== undefined) {
    if (explicitSizeType !== "roupas" && explicitSizeType !== "numerico" && explicitSizeType !== "unico" && explicitSizeType !== "custom") {
      throw new ApiError(400, "Tipo de tamanho inválido.");
    }

    current.sizeType = explicitSizeType;

    if (explicitSizeType === "unico") {
      current.sizes = [];
    }
  }

  if (sizesInput !== undefined) {
    if (explicitSizeType === "unico" && sizesInput.length > 0) {
      throw new ApiError(400, "Tipo de tamanho \"Único\" não aceita estoque por tamanho.");
    }

    if (sizesInput.length === 0) {
      current.sizeType = "unico";
      current.sizes = [];
    } else {
      current.sizes = sizesInput;
      if (inferSizeType(current) === "unico") {
        current.sizeType = "custom";
      }
    }
  }

  const finalSizeType = inferSizeType(current);
  if (finalSizeType !== "unico") {
    const normalizedSizes = normalizeSizes(current.sizes);
    if (!normalizedSizes.length) throw new ApiError(400, "Informe ao menos um tamanho.");

    current.sizes = normalizedSizes;
    current.size = normalizedSizes.map((row) => row.label).join(", ");
    current.stock = sumActiveSizeStock(normalizedSizes);
  } else {
    if (input.size !== undefined) current.size = input.size?.trim() || undefined;
    if (input.stock !== undefined) current.stock = Math.max(0, Math.floor(input.stock));
  }

  if (input.price !== undefined) current.priceCents = toCents(input.price);
  if (input.compareAtPrice !== undefined) {
    current.compareAtPriceCents = input.compareAtPrice > 0 ? toCents(input.compareAtPrice) : undefined;
  }
  if (input.shortDescription !== undefined) current.shortDescription = input.shortDescription.trim();
  if (input.description !== undefined) current.description = input.description.trim();
  if (input.additionalInfo !== undefined) current.additionalInfo = normalizeAdditionalInfo(input.additionalInfo);
  if (input.tags !== undefined) current.tags = input.tags;
  if (input.status !== undefined) current.status = input.status;
  if (input.active !== undefined) current.active = input.active;
  if (input.images !== undefined) current.images = input.images;

  current.slug = slugify(`${current.name}-${current.sku}`);

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: current.name,
      slug: current.slug,
      sku: current.sku,
      groupKey: current.groupKey,
      colorName: current.colorName,
      colorHex: current.colorHex,
      category: current.category,
      size: current.size,
      sizeType: current.sizeType,
      sizes: current.sizes as any,
      stock: current.stock,
      priceCents: current.priceCents,
      compareAtPriceCents: current.compareAtPriceCents,
      shortDescription: current.shortDescription,
      description: current.description,
      additionalInfo: normalizeAdditionalInfo(current.additionalInfo) as any,
      tags: (current.tags || []) as any,
      status: current.status,
      active: current.active,
      images: (current.images || []) as any,
    },
  });

  await invalidateProductCacheByIdentity({
    id: String(updated.id),
    slug: updated.slug,
    previousSlug,
  });

  return toAdmin(updated);
}

export async function toggleProductActivation(id: string, active: boolean) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Produto não encontrado.");

  const updated = await prisma.product.update({
    where: { id },
    data: { active },
  });

  await invalidateProductCacheByIdentity({
    id: String(updated.id),
    slug: updated.slug,
  });

  return toAdmin(updated);
}

export async function listStoreProducts(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  status?: string;
  active?: boolean;
  sort?: string;
  maxPrice?: number;
  includeVariants?: boolean;
}) {
  const page = Math.max(1, Math.floor(input.page || 1));
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit || 20)));

  const version = await getCacheVersion(PRODUCTS_LIST_VERSION_KEY, 1);
  const listHash = hashCacheQuery({
    page,
    limit,
    q: input.q || "",
    category: input.category || "",
    status: input.status || "",
    active: input.active ?? true,
    sort: input.sort || "",
    maxPrice: input.maxPrice ?? "",
    includeVariants: Boolean(input.includeVariants),
  });

  const cacheKey = `cache:v1:products:list:v${version}:${listHash}`;

  return getOrSetCache(cacheKey, PRODUCTS_LIST_TTL_SECONDS, async () => {
    const where: any = {};

    if (input.q) {
      where.OR = [
        { name: { contains: input.q, mode: "insensitive" } },
        { category: { contains: input.q, mode: "insensitive" } },
      ];
    }

    if (input.category) {
      const key = canonicalCategory(input.category);
      if (key === "casual") {
        where.category = { in: ["casual", "acessorios"] };
      } else {
        where.category = canonicalCategory(input.category);
      }
    }
    if (input.status && input.status !== "all") where.status = input.status;
    where.active = input.active ?? true;
    where.stock = { gt: 0 };

    if (input.maxPrice && Number.isFinite(input.maxPrice)) {
      where.priceCents = { lte: toCents(input.maxPrice) };
    }

    let orderBy: any = [{ createdAt: "desc" }, { id: "desc" }];
    if (input.sort === "price_asc") orderBy = [{ priceCents: "asc" }, { id: "asc" }];
    if (input.sort === "price_desc") orderBy = [{ priceCents: "desc" }, { id: "desc" }];
    if (input.sort === "newest") orderBy = [{ createdAt: "desc" }, { id: "desc" }];

    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: limit }),
      prisma.product.count({ where }),
    ]);

    const base = rows.map(toStore);

    if (!input.includeVariants) {
      return {
        data: base,
        meta: buildMeta(total, page, limit),
      };
    }

    const groupKeys = Array.from(
      new Set(
        rows
          .map((row) => (typeof row.groupKey === "string" ? row.groupKey.trim() : ""))
          .filter(Boolean),
      ),
    );

    if (groupKeys.length === 0) {
      return {
        data: base.map((item) => ({ ...item, colorVariants: [] })),
        meta: buildMeta(total, page, limit),
      };
    }

    const variantDocs = await prisma.product.findMany({
      where: { groupKey: { in: groupKeys } },
      select: {
        id: true,
        groupKey: true,
        slug: true,
        colorName: true,
        colorHex: true,
        active: true,
        stock: true,
      },
      orderBy: [{ groupKey: "asc" }, { colorName: "asc" }, { slug: "asc" }],
    });

    const variantsByGroup = new Map<
      string,
      Array<{
        id: string;
        slug: string;
        colorName?: string;
        colorHex?: string;
        isAvailable: boolean;
      }>
    >();

    for (const doc of variantDocs) {
      const groupKey = typeof doc.groupKey === "string" ? doc.groupKey.trim() : "";
      if (!groupKey) continue;

      const mapped = {
        id: String(doc.id),
        slug: doc.slug,
        colorName: doc.colorName || undefined,
        colorHex: doc.colorHex || undefined,
        isAvailable: Boolean(doc.active) && Number(doc.stock || 0) > 0,
      };

      const list = variantsByGroup.get(groupKey) ?? [];
      list.push(mapped);
      variantsByGroup.set(groupKey, list);
    }

    return {
      data: base.map((product, index) => {
        const groupKey = typeof rows[index]?.groupKey === "string" ? rows[index].groupKey.trim() : "";
        const full = groupKey ? variantsByGroup.get(groupKey) ?? [] : [];

        let limited = full.slice(0, 6);
        const current = product.slug ? full.find((item) => item.slug === product.slug) : undefined;
        if (current && !limited.some((item) => item.slug === current.slug)) {
          limited = [...limited.slice(0, 5), current];
        }

        const unique = Array.from(new Map(limited.map((item) => [item.slug, item] as const)).values());

        return {
          ...product,
          colorVariants: unique,
        };
      }),
      meta: buildMeta(total, page, limit),
    };
  });
}

export async function getStoreProductBySlug(slug: string) {
  const key = `cache:v1:products:item:${slug}`;
  const cached = await getOrSetCache(key, PRODUCT_ITEM_TTL_SECONDS, async () => {
    const product = await prisma.product.findFirst({ where: { slug, active: true, stock: { gt: 0 } } });
    if (!product) throw new ApiError(404, "Produto não encontrado.");
    return toStore(product);
  });

  const stock = await getCachedStockByProductId(cached.id);
  if (stock.stock <= 0) throw new ApiError(404, "Produto não encontrado.");

  return mergeStoreProductStock(cached, stock);
}

export async function getStoreProductVariantsBySlug(slug: string) {
  const key = `cache:v1:products:item:${slug}:variants`;
  return getOrSetCache(key, PRODUCTS_LIST_TTL_SECONDS, async () => {
    const product = await prisma.product.findFirst({ where: { slug, active: true, stock: { gt: 0 } } });
    if (!product) throw new ApiError(404, "Produto não encontrado.");

    const groupKey = typeof product.groupKey === "string" ? product.groupKey.trim() : "";
    if (!groupKey) {
      return {
        groupKey: "",
        current: {
          id: String(product.id),
          slug: product.slug,
          colorName: product.colorName || undefined,
          colorHex: product.colorHex || undefined,
          active: Boolean(product.active),
          totalStock: Math.max(0, Math.floor(Number(product.stock ?? 0))),
          isAvailable: Boolean(product.active) && Number(product.stock || 0) > 0,
        },
        variants: [],
      };
    }

    const variants = await prisma.product.findMany({
      where: { groupKey },
      orderBy: [{ colorName: "asc" }, { slug: "asc" }],
    });

    const current = variants.find((item) => item.slug === product.slug) ?? product;

    const mapped = variants.map((variant) => ({
      id: String(variant.id),
      slug: variant.slug,
      colorName: variant.colorName || undefined,
      colorHex: variant.colorHex || undefined,
      active: Boolean(variant.active),
      totalStock: Math.max(0, Math.floor(Number(variant.stock ?? 0))),
      isAvailable: Boolean(variant.active) && Number(variant.stock || 0) > 0,
    }));

    return {
      groupKey,
      current: {
        id: String(current.id),
        slug: current.slug,
        colorName: current.colorName || undefined,
        colorHex: current.colorHex || undefined,
        active: Boolean(current.active),
        totalStock: Math.max(0, Math.floor(Number(current.stock ?? 0))),
        isAvailable: Boolean(current.active) && Number(current.stock || 0) > 0,
      },
      variants: mapped,
    };
  });
}

export async function listLowStockProducts(limit = 10) {
  const rows = await prisma.product.findMany({
    where: { stock: { lte: 5 } },
    orderBy: { stock: "asc" },
    take: limit,
  });
  return rows.map(toAdmin);
}

export async function getProductByIdOrFail(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Produto não encontrado.");
  return product;
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new ApiError(404, "Produto não encontrado.");

  const slug = String(product.slug || "");

  await prisma.$transaction(async (tx) => {
    await tx.favorite.deleteMany({ where: { productId: product.id } });
    await tx.product.delete({ where: { id: product.id } });
  });

  await invalidateProductCacheByIdentity({
    id: String(product.id),
    slug,
  });

  return { success: true };
}
