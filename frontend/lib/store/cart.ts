import type { Product } from "@/lib/productsData";

export const CART_STORAGE_KEY = "marima_cart_v1";
export const DEFAULT_SHIPPING_CENTS = 990;
export const FREE_SHIPPING_THRESHOLD_CENTS = 29900;
export const DEFAULT_TAX_RATE = 0.08;

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  qty: number;
  stock: number;
  variant?: string;
  sizeLabel?: string;
};

export type CartItemInput = {
  id?: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  qty?: number;
  stock?: number;
  variant?: string;
  sizeLabel?: string;
};

export type CartState = {
  items: CartItem[];
  isHydrated: boolean;
};

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

export type CartReducerAction =
  | { type: "hydrate"; payload: CartState }
  | { type: "add_item"; payload: CartItemInput }
  | { type: "remove_item"; payload: { itemId: string } }
  | { type: "set_qty"; payload: { itemId: string; qty: number } }
  | { type: "clear" };

export const INITIAL_CART_STATE: CartState = {
  items: [],
  isHydrated: false,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function toMoneyBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function createCartItemId(productId: string, variant?: string, sizeLabel?: string) {
  const key = (variant?.trim() || sizeLabel?.trim() || "default").toLowerCase();
  return `${productId}:${key}`;
}

export function toCartItemInput(
  product: Product,
  options?: {
    qty?: number;
    variant?: string;
    sizeLabel?: string;
  },
): CartItemInput {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.title,
    imageUrl: product.image,
    unitPrice: Math.round(product.price * 100),
    qty: options?.qty ?? 1,
    stock: product.stock,
    variant: options?.variant,
    sizeLabel: options?.sizeLabel,
  };
}

export function normalizeCartItem(input: CartItemInput): CartItem {
  const qty = Math.max(1, Math.floor(input.qty ?? 1));
  const stock = Math.max(1, Math.floor(input.stock ?? 999));
  const id = input.id ?? createCartItemId(input.productId, input.variant, input.sizeLabel);
  return {
    id,
    productId: input.productId,
    slug: input.slug,
    name: input.name,
    imageUrl: input.imageUrl,
    unitPrice: Math.max(0, Math.floor(input.unitPrice)),
    qty: clamp(qty, 1, stock),
    stock,
    variant: input.variant,
    sizeLabel: input.sizeLabel,
  };
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CartItem>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.productId === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.imageUrl === "string" &&
    typeof candidate.unitPrice === "number" &&
    typeof candidate.qty === "number" &&
    typeof candidate.stock === "number"
  );
}

export function sanitizeCartState(value: unknown): CartState {
  if (!value || typeof value !== "object") {
    return {
      items: [],
      isHydrated: true,
    };
  }

  const parsed = value as { items?: unknown[] };
  const items = Array.isArray(parsed.items)
    ? parsed.items
        .filter(isCartItem)
        .map((item) => normalizeCartItem(item))
    : [];

  return {
    items,
    isHydrated: true,
  };
}

export function cartReducer(state: CartState, action: CartReducerAction): CartState {
  switch (action.type) {
    case "hydrate":
      return sanitizeCartState(action.payload);

    case "add_item": {
      const next = normalizeCartItem(action.payload);
      const index = state.items.findIndex((item) => item.id === next.id);
      if (index === -1) {
        return { ...state, items: [...state.items, next] };
      }

      const current = state.items[index]!;
      const merged = {
        ...current,
        qty: clamp(current.qty + next.qty, 1, current.stock),
      };
      return {
        ...state,
        items: state.items.map((item, itemIndex) => (itemIndex === index ? merged : item)),
      };
    }

    case "remove_item":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.itemId),
      };

    case "set_qty":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.itemId
            ? { ...item, qty: clamp(Math.floor(action.payload.qty), 1, item.stock) }
            : item,
        ),
      };

    case "clear":
      return {
        ...state,
        items: [],
      };
  }
}

export function calculateCartTotals(
  items: CartItem[],
  options?: {
    shippingCents?: number;
    discountCents?: number;
    taxRate?: number;
  },
): CartTotals {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  const discount = Math.max(0, options?.discountCents ?? 0);
  const taxRate = options?.taxRate ?? DEFAULT_TAX_RATE;
  const shipping =
    options?.shippingCents ??
    (subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : items.length > 0 ? DEFAULT_SHIPPING_CENTS : 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: Math.max(0, taxable + shipping + tax),
  };
}

