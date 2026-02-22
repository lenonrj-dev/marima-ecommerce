import { randomUUID } from "crypto";
import { Types } from "../lib/dbCompat";
import { env } from "../config/env";
import { delCache, getOrSetCache } from "../lib/cache";
import { CartModel } from "../models/Cart";
import { CouponModel } from "../models/Coupon";
import { ProductModel } from "../models/Product";
import { SavedCartModel } from "../models/SavedCart";
import { SharedCartModel } from "../models/SharedCart";
import { ApiError } from "../utils/apiError";

const SHIPPING_FLAT_CENTS = 1290;
const FREE_SHIPPING_THRESHOLD_CENTS = 29900;
const TAX_RATE = 0.08;
const SHARED_CART_TTL_DAYS = 1;

export const GUEST_CART_COOKIE = "marima_guest_cart";

const CART_CACHE_TTL_SECONDS = 60 * 5;

type SnapshotItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  variant?: string;
  sizeLabel?: string;
  unitPriceCents: number;
  qty: number;
  stock: number;
};

export type CartIdentity = {
  customerId?: string;
  guestToken?: string;
};

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function buildCartCacheKey(identity: CartIdentity) {
  if (identity.customerId) return `cache:v1:cart:saved:${identity.customerId}`;
  if (identity.guestToken) return `cache:v1:cart:saved:guest:${identity.guestToken}`;
  return null;
}

export async function invalidateCartCache(identity: CartIdentity) {
  const key = buildCartCacheKey(identity);
  if (!key) return;
  await delCache(key);
}

function computeTotals(cart: any, options?: { forceFreeShipping?: boolean }) {
  const subtotalCents = cart.items.reduce((acc: number, item: any) => acc + item.unitPriceCents * item.qty, 0);
  const discountCents = cart.discountCents || 0;
  const taxable = Math.max(0, subtotalCents - discountCents);

  const shouldForceFreeShipping =
    options?.forceFreeShipping !== undefined ? options.forceFreeShipping : Boolean(cart.freeShippingCouponApplied);

  const shippingCents = shouldForceFreeShipping
    ? 0
    : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS || subtotalCents === 0
      ? 0
      : SHIPPING_FLAT_CENTS;

  const taxCents = Math.round(taxable * TAX_RATE);
  const totalCents = Math.max(0, taxable + shippingCents + taxCents);

  cart.subtotalCents = subtotalCents;
  cart.shippingCents = shippingCents;
  cart.taxCents = taxCents;
  cart.totalCents = totalCents;
}

function toOutput(cart: any) {
  return {
    id: String(cart._id),
    customerId: cart.customerId ? String(cart.customerId) : undefined,
    guestToken: cart.guestToken,
    status: cart.status,
    recovered: cart.recovered,
    lastActivityAt: toIsoDate(cart.lastActivityAt),
    couponCode: cart.couponCode,
    freeShippingCouponApplied: Boolean(cart.freeShippingCouponApplied),
    items: cart.items.map((item: any) => ({
      itemId: String(item._id),
      id: String(item._id),
      productId: String(item.productId),
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      variant: item.variant,
      sizeLabel: item.sizeLabel,
      unitPrice: item.unitPriceCents,
      unitPriceCents: item.unitPriceCents,
      qty: item.qty,
      stock: item.stock,
      subtotalCents: item.unitPriceCents * item.qty,
    })),
    totals: {
      subtotal: cart.subtotalCents,
      discount: cart.discountCents,
      shipping: cart.shippingCents,
      tax: cart.taxCents,
      total: cart.totalCents,
      subtotalCents: cart.subtotalCents,
      discountCents: cart.discountCents,
      shippingCents: cart.shippingCents,
      taxCents: cart.taxCents,
      totalCents: cart.totalCents,
    },
  };
}

function toSnapshotItems(cart: any): SnapshotItem[] {
  return (cart.items || []).map((item: any) => ({
    productId: String(item.productId),
    slug: String(item.slug || ""),
    name: String(item.name || ""),
    imageUrl: String(item.imageUrl || ""),
    variant: item.variant ? String(item.variant) : undefined,
    sizeLabel: item.sizeLabel ? String(item.sizeLabel) : undefined,
    unitPriceCents: Math.max(0, Math.floor(Number(item.unitPriceCents || 0))),
    qty: Math.max(1, Math.floor(Number(item.qty || 1))),
    stock: Math.max(0, Math.floor(Number(item.stock || 0))),
  }));
}

function normalizeSnapshotItem(input: unknown): SnapshotItem | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Partial<SnapshotItem>;

  const productId = String(row.productId || "").trim();
  if (!Types.ObjectId.isValid(productId)) return null;

  const slug = String(row.slug || "").trim();
  const name = String(row.name || "").trim();
  const imageUrl = String(row.imageUrl || "").trim();

  if (!slug || !name || !imageUrl) return null;

  const qty = Math.max(1, Math.floor(Number(row.qty || 1)));
  const stock = Math.max(0, Math.floor(Number(row.stock || 0)));
  const unitPriceCents = Math.max(0, Math.floor(Number(row.unitPriceCents || 0)));

  return {
    productId,
    slug,
    name,
    imageUrl,
    variant: typeof row.variant === "string" && row.variant.trim() ? row.variant.trim() : undefined,
    sizeLabel: typeof row.sizeLabel === "string" && row.sizeLabel.trim() ? row.sizeLabel.trim() : undefined,
    unitPriceCents,
    qty,
    stock,
  };
}

function normalizeStoreBaseUrl() {
  const base = String(env.STORE_URL || "").trim();
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

function buildSharedCartPath(token: string) {
  return `/carrinho/compartilhado/${token}`;
}

function toSavedCartOutput(row: any) {
  return {
    id: String(row._id),
    title: row.title || "Carrinho salvo",
    itemCount: Number(row.itemCount || 0),
    couponCode: row.couponCode || undefined,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt),
    items: (row.items || []).map((item: any) => ({
      productId: String(item.productId),
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      variant: item.variant,
      sizeLabel: item.sizeLabel,
      unitPriceCents: item.unitPriceCents,
      qty: item.qty,
      stock: item.stock,
      subtotalCents: item.unitPriceCents * item.qty,
    })),
    totals: {
      subtotalCents: Number(row.subtotalCents || 0),
      discountCents: Number(row.discountCents || 0),
      shippingCents: Number(row.shippingCents || 0),
      taxCents: Number(row.taxCents || 0),
      totalCents: Number(row.totalCents || 0),
    },
  };
}

function toSharedCartOutput(row: any) {
  return {
    token: row.token,
    savedCartId: row.sourceSavedCartId ? String(row.sourceSavedCartId) : undefined,
    itemCount: Number(row.itemCount || 0),
    couponCode: row.couponCode || undefined,
    expiresAt: toIsoDate(row.expiresAt),
    createdAt: toIsoDate(row.createdAt),
    items: (row.items || []).map((item: any) => ({
      productId: String(item.productId),
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      variant: item.variant,
      sizeLabel: item.sizeLabel,
      unitPriceCents: item.unitPriceCents,
      qty: item.qty,
      stock: item.stock,
      subtotalCents: item.unitPriceCents * item.qty,
    })),
    totals: {
      subtotalCents: Number(row.subtotalCents || 0),
      discountCents: Number(row.discountCents || 0),
      shippingCents: Number(row.shippingCents || 0),
      taxCents: Number(row.taxCents || 0),
      totalCents: Number(row.totalCents || 0),
    },
  };
}

function toSharedLinkOutput(row: any) {
  const path = buildSharedCartPath(String(row.token || ""));
  const storeBase = normalizeStoreBaseUrl();

  return {
    token: String(row.token || ""),
    savedCartId: row.sourceSavedCartId ? String(row.sourceSavedCartId) : undefined,
    path,
    url: storeBase ? `${storeBase}${path}` : path,
    expiresAt: toIsoDate(row.expiresAt),
  };
}

async function replaceCartWithSnapshot(identity: CartIdentity, snapshotItems: unknown[]) {
  const normalizedItems = snapshotItems
    .map((row) => normalizeSnapshotItem(row))
    .filter((row): row is SnapshotItem => row !== null);

  if (!normalizedItems.length) {
    throw new ApiError(400, "Nenhum item válido para carregar no carrinho.");
  }

  const cart = await getOrCreateCart(identity);
  cart.items = [];
  cart.couponCode = undefined;
  cart.discountCents = 0;
  cart.freeShippingCouponApplied = false;
  cart.lastActivityAt = new Date();
  computeTotals(cart);
  await cart.save();
  await invalidateCartCache(identity);

  let imported = 0;

  for (const item of normalizedItems) {
    try {
      await upsertCartItem(identity, {
        productId: item.productId,
        qty: item.qty,
        variant: item.variant,
        sizeLabel: item.sizeLabel,
      });
      imported += 1;
    } catch {
      // Ignora itens inválidos/sem estoque e continua importação.
    }
  }

  if (imported === 0) {
    throw new ApiError(400, "Não foi possível importar itens disponíveis para o carrinho.");
  }

  return getCart(identity);
}

async function getSharedCartDocumentByToken(token: string) {
  const normalized = String(token || "").trim();
  if (!normalized) throw new ApiError(400, "Token inválido.");

  const row = await SharedCartModel.findOne({ token: normalized });
  if (!row) throw new ApiError(404, "Carrinho compartilhado não encontrado.");

  const now = Date.now();
  const expiresAt = row.expiresAt ? row.expiresAt.getTime() : 0;
  if (expiresAt && expiresAt <= now) {
    await row.deleteOne();
    throw new ApiError(410, "Este link de carrinho compartilhado expirou.");
  }

  return row;
}

async function getSavedCartDocumentForCustomer(customerId: string, savedCartId: string) {
  if (!Types.ObjectId.isValid(savedCartId)) throw new ApiError(400, "Carrinho salvo inválido.");

  const row = await SavedCartModel.findOne({
    _id: new Types.ObjectId(savedCartId),
    customerId: new Types.ObjectId(customerId),
  });

  if (!row) throw new ApiError(404, "Carrinho salvo não encontrado.");

  return row;
}

export async function getOrCreateCart(identity: CartIdentity) {
  let cart;

  if (identity.customerId) {
    cart = await CartModel.findOne({ customerId: identity.customerId, status: "active" });
  } else if (identity.guestToken) {
    cart = await CartModel.findOne({ guestToken: identity.guestToken, status: "active" });
  }

  if (!cart) {
    cart = await CartModel.create({
      customerId: identity.customerId || undefined,
      guestToken: identity.customerId ? undefined : identity.guestToken || randomUUID(),
      items: [],
      status: "active",
      lastActivityAt: new Date(),
    });
  }

  computeTotals(cart);
  await cart.save();

  return cart;
}

export async function getCart(identity: CartIdentity) {
  const key = buildCartCacheKey(identity);
  if (!key) {
    const cart = await getOrCreateCart(identity);
    return toOutput(cart);
  }

  return getOrSetCache(key, CART_CACHE_TTL_SECONDS, async () => {
    const cart = await getOrCreateCart(identity);
    return toOutput(cart);
  });
}

function normalizeVariant(value?: string) {
  return value?.trim().toLowerCase() || "default";
}

function normalizeSizeLabel(value?: string) {
  return value?.trim().toLowerCase() || "default";
}

export async function upsertCartItem(
  identity: CartIdentity,
  input: { productId: string; qty: number; variant?: string; sizeLabel?: string },
) {
  if (!Types.ObjectId.isValid(input.productId)) throw new ApiError(400, "Produto inválido.");

  const product = await ProductModel.findById(input.productId);
  if (!product || !product.active) throw new ApiError(404, "Produto não encontrado.");
  if (product.stock <= 0) throw new ApiError(400, "Produto sem estoque.");

  const sizeType =
    (product.sizeType as string) || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
  const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;

  let sizeLabel: string | undefined;
  let availableStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));

  if (hasSizes) {
    const rawLabel = String(input.sizeLabel || "").trim();
    if (!rawLabel) throw new ApiError(400, "Selecione um tamanho.");

    const normalized = rawLabel.toLocaleLowerCase("pt-BR");
    const row = product.sizes.find((entry: any) => {
      const label = String(entry?.label || "").trim();
      const active = entry?.active === undefined ? true : Boolean(entry.active);
      return active && label.toLocaleLowerCase("pt-BR") === normalized;
    });

    if (!row) throw new ApiError(400, "Tamanho inválido para este produto.");

    sizeLabel = String(row.label || rawLabel).trim();
    availableStock = Math.max(0, Math.floor(Number(row.stock ?? 0)));

    if (availableStock <= 0) throw new ApiError(400, "Tamanho sem estoque.");
  }

  const cart = await getOrCreateCart(identity);
  const qty = Math.max(1, Math.floor(input.qty));
  const variantKey = normalizeVariant(input.variant);
  const sizeKey = normalizeSizeLabel(sizeLabel);

  const existing = cart.items.find(
    (item: any) =>
      String(item.productId) === String(product._id) &&
      normalizeVariant(item.variant) === variantKey &&
      normalizeSizeLabel(item.sizeLabel) === sizeKey,
  );
  if (existing) {
    existing.qty = Math.min(availableStock, qty);
    existing.stock = availableStock;
    existing.unitPriceCents = product.priceCents;
    existing.slug = product.slug;
    existing.name = product.name;
    existing.imageUrl = product.images?.[0] || "";
    existing.variant = input.variant;
    existing.sizeLabel = sizeLabel;
  } else {
    cart.items.push({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.images?.[0] || "",
      variant: input.variant,
      sizeLabel,
      unitPriceCents: product.priceCents,
      qty: Math.min(availableStock, qty),
      stock: availableStock,
    });
  }

  cart.lastActivityAt = new Date();
  cart.status = "active";
  cart.recovered = false;
  computeTotals(cart);
  await cart.save();
  await invalidateCartCache(identity);

  return toOutput(cart);
}

export async function patchCartItemQty(identity: CartIdentity, itemId: string, qty: number) {
  const cart = await getOrCreateCart(identity);
  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, "Item não encontrado no carrinho.");

  const product = await ProductModel.findById(item.productId);
  if (!product || !product.active) {
    item.deleteOne();
    cart.lastActivityAt = new Date();
    computeTotals(cart);
    await cart.save();
    await invalidateCartCache(identity);
    return toOutput(cart);
  }

  const sizeType =
    (product.sizeType as string) || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
  const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;

  let availableStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));

  if (hasSizes) {
    const rawLabel = String(item.sizeLabel || "").trim();
    if (!rawLabel) {
      item.deleteOne();
      cart.lastActivityAt = new Date();
      computeTotals(cart);
      await cart.save();
      await invalidateCartCache(identity);
      return toOutput(cart);
    }

    const normalized = rawLabel.toLocaleLowerCase("pt-BR");
    const row = product.sizes.find((entry: any) => {
      const label = String(entry?.label || "").trim();
      const active = entry?.active === undefined ? true : Boolean(entry.active);
      return active && label.toLocaleLowerCase("pt-BR") === normalized;
    });

    availableStock = row ? Math.max(0, Math.floor(Number(row.stock ?? 0))) : 0;
  }

  if (availableStock <= 0) {
    item.deleteOne();
    cart.lastActivityAt = new Date();
    computeTotals(cart);
    await cart.save();
    await invalidateCartCache(identity);
    return toOutput(cart);
  }

  item.slug = product.slug;
  item.name = product.name;
  item.imageUrl = product.images?.[0] || item.imageUrl;
  item.unitPriceCents = product.priceCents;
  item.stock = availableStock;
  item.qty = Math.min(availableStock, Math.max(1, Math.floor(qty)));
  cart.lastActivityAt = new Date();
  computeTotals(cart);
  await cart.save();
  await invalidateCartCache(identity);

  return toOutput(cart);
}

export async function deleteCartItem(identity: CartIdentity, itemId: string) {
  const cart = await getOrCreateCart(identity);
  const item = (cart.items || []).find((row: any) => String(row?._id || "") === String(itemId));
  if (!item) return toOutput(cart);

  if (typeof item.deleteOne === "function") {
    item.deleteOne();
  } else {
    cart.items = (cart.items || []).filter((row: any) => String(row?._id || "") !== String(itemId));
  }

  cart.lastActivityAt = new Date();
  computeTotals(cart);
  await cart.save();
  await invalidateCartCache(identity);

  return toOutput(cart);
}

export async function applyCouponToCart(identity: CartIdentity, code: string) {
  const cart = await getOrCreateCart(identity);
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    cart.couponCode = undefined;
    cart.discountCents = 0;
    cart.freeShippingCouponApplied = false;
    computeTotals(cart);
    await cart.save();
    await invalidateCartCache(identity);
    return toOutput(cart);
  }

  const coupon = await CouponModel.findOne({ code: normalized, active: true });
  if (!coupon) throw new ApiError(404, "Cupom não encontrado.");

  const now = new Date();
  if (coupon.startsAt > now || coupon.endsAt < now) {
    throw new ApiError(400, "Cupom fora do período de validade.");
  }

  if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
    throw new ApiError(400, "Cupom atingiu o limite de usos.");
  }

  const subtotal = cart.items.reduce((acc: number, item: any) => acc + item.unitPriceCents * item.qty, 0);
  if (coupon.minSubtotalCents && subtotal < coupon.minSubtotalCents) {
    throw new ApiError(400, "Subtotal mínimo não atingido para este cupom.");
  }

  let discount = 0;
  let freeShipping = false;

  if (coupon.type === "percent") discount = Math.round(subtotal * (coupon.amount / 100));
  if (coupon.type === "fixed") discount = Math.min(subtotal, coupon.amount);
  if (coupon.type === "shipping") freeShipping = true;

  cart.couponCode = normalized;
  cart.discountCents = discount;
  cart.freeShippingCouponApplied = freeShipping;
  computeTotals(cart, { forceFreeShipping: freeShipping });
  await cart.save();
  await invalidateCartCache(identity);

  return toOutput(cart);
}

export async function removeCouponFromCart(identity: CartIdentity) {
  return applyCouponToCart(identity, "");
}

export async function saveCartSnapshotForCustomer(customerId: string) {
  const identity: CartIdentity = { customerId };
  const cart = await getOrCreateCart(identity);

  if (!cart.items.length) {
    throw new ApiError(400, "Adicione itens ao carrinho antes de salvar.");
  }

  const items = toSnapshotItems(cart);
  const itemCount = items.reduce((acc, item) => acc + item.qty, 0);

  const created = await SavedCartModel.create({
    customerId: new Types.ObjectId(customerId),
    sourceCartId: cart._id,
    title: `Carrinho salvo em ${new Date().toLocaleDateString("pt-BR")}`,
    items,
    itemCount,
    couponCode: cart.couponCode || undefined,
    discountCents: cart.discountCents || 0,
    shippingCents: cart.shippingCents || 0,
    taxCents: cart.taxCents || 0,
    subtotalCents: cart.subtotalCents || 0,
    totalCents: cart.totalCents || 0,
  });

  return toSavedCartOutput(created);
}

export async function listSavedCartsForCustomer(customerId: string) {
  const rows = await SavedCartModel.find({ customerId: new Types.ObjectId(customerId) })
    .sort({ createdAt: -1 })
    .limit(30);

  return rows.map((row) => toSavedCartOutput(row));
}

export async function getSavedCartForCustomer(customerId: string, savedCartId: string) {
  const row = await getSavedCartDocumentForCustomer(customerId, savedCartId);
  return toSavedCartOutput(row);
}

export async function deleteSavedCartForCustomer(customerId: string, savedCartId: string) {
  const row = await getSavedCartDocumentForCustomer(customerId, savedCartId);

  await Promise.all([
    SavedCartModel.deleteOne({ _id: row._id }),
    SharedCartModel.deleteMany({ sourceSavedCartId: row._id }),
  ]);
}

export async function loadSavedCartForCustomer(customerId: string, savedCartId: string) {
  const row = await getSavedCartDocumentForCustomer(customerId, savedCartId);

  const cart = await replaceCartWithSnapshot({ customerId }, row.items || []);

  return {
    savedCart: toSavedCartOutput(row),
    cart,
  };
}

export async function shareSavedCartForCustomer(customerId: string, savedCartId: string) {
  const row = await getSavedCartDocumentForCustomer(customerId, savedCartId);
  const now = new Date();

  const existing = await SharedCartModel.findOne({
    sourceSavedCartId: row._id,
    sourceCustomerId: new Types.ObjectId(customerId),
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });

  if (existing) {
    return toSharedLinkOutput(existing);
  }

  const token = randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SHARED_CART_TTL_DAYS * 24 * 60 * 60 * 1000);
  const items = (row.items || []).map((item: any) => ({
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    imageUrl: item.imageUrl,
    variant: item.variant,
    sizeLabel: item.sizeLabel,
    unitPriceCents: item.unitPriceCents,
    qty: item.qty,
    stock: item.stock,
  }));

  const shared = await SharedCartModel.create({
    token,
    sourceCustomerId: new Types.ObjectId(customerId),
    sourceSavedCartId: row._id,
    sourceCartId: row.sourceCartId || undefined,
    items,
    itemCount: Number(row.itemCount || 0),
    couponCode: row.couponCode || undefined,
    discountCents: Number(row.discountCents || 0),
    shippingCents: Number(row.shippingCents || 0),
    taxCents: Number(row.taxCents || 0),
    subtotalCents: Number(row.subtotalCents || 0),
    totalCents: Number(row.totalCents || 0),
    expiresAt,
  });

  return toSharedLinkOutput(shared);
}

export async function revokeSavedCartShareForCustomer(customerId: string, savedCartId: string) {
  const row = await getSavedCartDocumentForCustomer(customerId, savedCartId);
  await SharedCartModel.deleteMany({
    sourceSavedCartId: row._id,
    sourceCustomerId: new Types.ObjectId(customerId),
  });
}

export async function createSharedCartLink(identity: CartIdentity) {
  const cart = await getOrCreateCart(identity);
  if (!cart.items.length) {
    throw new ApiError(400, "Adicione itens ao carrinho antes de compartilhar.");
  }

  const token = randomUUID().replace(/-/g, "");
  const items = toSnapshotItems(cart);
  const itemCount = items.reduce((acc, item) => acc + item.qty, 0);
  const expiresAt = new Date(Date.now() + SHARED_CART_TTL_DAYS * 24 * 60 * 60 * 1000);

  const shared = await SharedCartModel.create({
    token,
    sourceCustomerId: identity.customerId ? new Types.ObjectId(identity.customerId) : undefined,
    sourceCartId: cart._id,
    items,
    itemCount,
    couponCode: cart.couponCode || undefined,
    discountCents: cart.discountCents || 0,
    shippingCents: cart.shippingCents || 0,
    taxCents: cart.taxCents || 0,
    subtotalCents: cart.subtotalCents || 0,
    totalCents: cart.totalCents || 0,
    expiresAt,
  });

  return toSharedLinkOutput(shared);
}

export async function getSharedCartByToken(token: string) {
  const row = await getSharedCartDocumentByToken(token);
  return toSharedCartOutput(row);
}

export async function importSharedCartByToken(identity: CartIdentity, token: string) {
  const row = await getSharedCartDocumentByToken(token);
  const cart = await replaceCartWithSnapshot(identity, row.items || []);

  return {
    sharedCart: toSharedCartOutput(row),
    cart,
  };
}

export async function bindGuestCartToCustomer(guestToken: string, customerId: string) {
  if (!guestToken) return;

  const guestCart = await CartModel.findOne({ guestToken, status: "active" });
  if (!guestCart) return;

  const customerObjectId = new Types.ObjectId(customerId);
  const customerCart = await CartModel.findOne({ customerId: customerObjectId, status: "active" });

  if (!customerCart) {
    guestCart.customerId = customerObjectId;
    guestCart.guestToken = undefined;
    guestCart.lastActivityAt = new Date();
    computeTotals(guestCart);
    await guestCart.save();
    await invalidateCartCache({ guestToken });
    await invalidateCartCache({ customerId });
    return;
  }

  for (const guestItem of guestCart.items) {
    const variantKey = normalizeVariant(guestItem.variant);
    const sizeKey = normalizeSizeLabel(guestItem.sizeLabel);
    const existing = customerCart.items.find(
      (item: any) =>
        String(item.productId) === String(guestItem.productId) &&
        normalizeVariant(item.variant) === variantKey &&
        normalizeSizeLabel(item.sizeLabel) === sizeKey,
    );

    if (existing) {
      existing.qty += guestItem.qty;
      continue;
    }

    customerCart.items.push({
      productId: guestItem.productId,
      slug: guestItem.slug,
      name: guestItem.name,
      imageUrl: guestItem.imageUrl,
      variant: guestItem.variant,
      sizeLabel: guestItem.sizeLabel,
      unitPriceCents: guestItem.unitPriceCents,
      qty: guestItem.qty,
      stock: guestItem.stock,
    });
  }

  for (const item of [...customerCart.items]) {
    const product = await ProductModel.findById(item.productId);
    if (!product || !product.active) {
      item.deleteOne();
      continue;
    }

    const sizeType =
      (product.sizeType as string) || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
    const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;

    let availableStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));

    if (hasSizes) {
      const rawLabel = String(item.sizeLabel || "").trim();
      if (!rawLabel) {
        item.deleteOne();
        continue;
      }

      const normalized = rawLabel.toLocaleLowerCase("pt-BR");
      const row = product.sizes.find((entry: any) => {
        const label = String(entry?.label || "").trim();
        const active = entry?.active === undefined ? true : Boolean(entry.active);
        return active && label.toLocaleLowerCase("pt-BR") === normalized;
      });

      availableStock = row ? Math.max(0, Math.floor(Number(row.stock ?? 0))) : 0;
    }

    if (availableStock <= 0) {
      item.deleteOne();
      continue;
    }

    item.slug = product.slug;
    item.name = product.name;
    item.imageUrl = product.images?.[0] || item.imageUrl;
    item.unitPriceCents = product.priceCents;
    item.stock = availableStock;
    item.qty = Math.min(availableStock, Math.max(1, Math.floor(item.qty)));
  }

  customerCart.lastActivityAt = new Date();
  computeTotals(customerCart);
  await customerCart.save();

  await guestCart.deleteOne();
  await invalidateCartCache({ guestToken });
  await invalidateCartCache({ customerId });
}

export async function markCartConverted(cartId: string) {
  const cart = await CartModel.findById(cartId);
  if (!cart) return;

  cart.status = "converted";
  cart.lastActivityAt = new Date();
  await cart.save();
  await invalidateCartCache({
    customerId: cart.customerId ? String(cart.customerId) : undefined,
    guestToken: cart.guestToken || undefined,
  });
}

function stageByDate(lastActivityAt: Date) {
  const diffHours = (Date.now() - lastActivityAt.getTime()) / 36e5;
  if (diffHours <= 24) return "quente";
  if (diffHours <= 72) return "morno";
  return "frio";
}

export async function listAbandonedCarts(input: { page: number; limit: number }) {
  const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000);

  await CartModel.updateMany(
    { status: "active", lastActivityAt: { $lte: threshold }, items: { $exists: true, $ne: [] } },
    { $set: { status: "abandoned" } },
  );

  const [rows, total] = await Promise.all([
    CartModel.find({ status: "abandoned" })
      .sort({ lastActivityAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    CartModel.countDocuments({ status: "abandoned" }),
  ]);

  return {
    data: rows.map((cart) => ({
      id: String(cart._id),
      customerName: "Cliente",
      email: "cliente@exemplo.com",
      itemsCount: cart.items.length,
      value: Number((cart.totalCents / 100).toFixed(2)),
      stage: stageByDate(cart.lastActivityAt),
      recovered: cart.recovered,
      lastActivityAt: toIsoDate(cart.lastActivityAt),
    })),
    meta: {
      total,
      page: input.page,
      limit: input.limit,
      pages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
}

export async function recoverAbandonedCart(cartId: string, note?: string) {
  const cart = await CartModel.findById(cartId);
  if (!cart) throw new ApiError(404, "Carrinho não encontrado.");

  cart.recovered = true;
  if (note) cart.notes.push(note);
  await cart.save();

  return { success: true };
}

export async function getCartForConversion(cartId: string) {
  const cart = await CartModel.findById(cartId);
  if (!cart) throw new ApiError(404, "Carrinho não encontrado.");
  if (!cart.items.length) throw new ApiError(400, "Carrinho sem itens.");
  return cart;
}




