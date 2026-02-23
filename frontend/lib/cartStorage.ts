const CART_STORAGE_KEY = "marima:cart:guest:v1";
const LEGACY_CART_STORAGE_KEYS = ["marima_cart_v1", "marima:cart:guest:v0"];
const CART_TTL_MS = 30 * 60 * 1000;

export type GuestCartItem = {
  productId: string;
  variantId?: string;
  sizeLabel?: string;
  qty: number;
};

type GuestCartSnapshot = {
  version: 1;
  updatedAt: number;
  expiresAt: number;
  items: GuestCartItem[];
  couponCode?: string | null;
};

type WriteGuestCartInput = {
  items: GuestCartItem[];
  couponCode?: string | null;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function itemKey(item: Pick<GuestCartItem, "productId" | "variantId" | "sizeLabel">) {
  return [
    normalizeString(item.productId),
    normalizeString(item.variantId).toLowerCase(),
    normalizeString(item.sizeLabel).toLowerCase(),
  ].join("::");
}

function normalizeGuestCartItems(items: unknown): GuestCartItem[] {
  if (!Array.isArray(items)) return [];

  const merged = new Map<string, GuestCartItem>();

  for (const entry of items) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Partial<GuestCartItem>;
    const productId = normalizeString(row.productId);
    if (!productId) continue;

    const variantId = normalizeString(row.variantId) || undefined;
    const sizeLabel = normalizeString(row.sizeLabel) || undefined;
    const qty = Math.max(1, Math.floor(Number(row.qty || 1)));

    const key = itemKey({ productId, variantId, sizeLabel });
    const current = merged.get(key);
    if (current) {
      current.qty = Math.min(99, current.qty + qty);
    } else {
      merged.set(key, { productId, variantId, sizeLabel, qty: Math.min(99, qty) });
    }
  }

  return Array.from(merged.values());
}

function parseSnapshot(raw: string | null): GuestCartSnapshot | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<GuestCartSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    if (Number(parsed.version) !== 1) return null;

    const updatedAt = Number(parsed.updatedAt || 0);
    const expiresAt = Number(parsed.expiresAt || 0);
    if (!Number.isFinite(updatedAt) || !Number.isFinite(expiresAt)) return null;

    const couponRaw = parsed.couponCode;
    const couponCode =
      typeof couponRaw === "string" && couponRaw.trim() ? couponRaw.trim().toUpperCase() : null;

    return {
      version: 1,
      updatedAt,
      expiresAt,
      items: normalizeGuestCartItems(parsed.items),
      couponCode,
    };
  } catch {
    return null;
  }
}

function now() {
  return Date.now();
}

export function getGuestCartStorageKey() {
  return CART_STORAGE_KEY;
}

export function getGuestCartTtlMs() {
  return CART_TTL_MS;
}

export function clearLegacyGuestCartStorage() {
  if (!isBrowser()) return;

  for (const key of LEGACY_CART_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors.
    }
  }
}

export function clearGuestCart() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors.
  }
}

export function readGuestCart(): GuestCartSnapshot | null {
  if (!isBrowser()) return null;

  const snapshot = parseSnapshot(window.localStorage.getItem(CART_STORAGE_KEY));
  if (!snapshot) {
    clearGuestCart();
    return null;
  }

  if (snapshot.expiresAt <= now()) {
    clearGuestCart();
    return null;
  }

  if (snapshot.items.length === 0) {
    clearGuestCart();
    return null;
  }

  return snapshot;
}

export function isGuestCartExpired() {
  if (!isBrowser()) return false;
  const snapshot = parseSnapshot(window.localStorage.getItem(CART_STORAGE_KEY));
  if (!snapshot) return false;
  return snapshot.expiresAt <= now();
}

export function writeGuestCart(input: WriteGuestCartInput) {
  if (!isBrowser()) return;

  const items = normalizeGuestCartItems(input.items);
  if (items.length === 0) {
    clearGuestCart();
    return;
  }

  const timestamp = now();
  const couponCode =
    typeof input.couponCode === "string" && input.couponCode.trim()
      ? input.couponCode.trim().toUpperCase()
      : null;

  const payload: GuestCartSnapshot = {
    version: 1,
    updatedAt: timestamp,
    expiresAt: timestamp + CART_TTL_MS,
    items,
    couponCode,
  };

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore localStorage errors.
  }
}

export function toGuestCartItems(
  items: Array<{ productId: string; variant?: string; sizeLabel?: string; qty: number }>,
) {
  return normalizeGuestCartItems(
    items.map((item) => ({
      productId: item.productId,
      variantId: item.variant,
      sizeLabel: item.sizeLabel,
      qty: item.qty,
    })),
  );
}

