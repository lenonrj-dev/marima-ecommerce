import type { CartItem, Totals } from "@/components/cart/CartProvider";

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatMoney(cents: number) {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style : "currency",
    currency: "BRL",
  });
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function calcTotals(params: { items : CartItem[];
  discountRate: number;
  taxRate: number;
  shippingFlat: number;
  freeShipThreshold: number;
  forceFreeShipping?: boolean;
}): Totals {
  const subtotal = params.items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  const discount = Math.round(subtotal * params.discountRate);

  const discounted = Math.max(0, subtotal - discount);

  const shouldFreeShip =
    Boolean(params.forceFreeShipping) || discounted >= params.freeShipThreshold;

  const shipping = params.items.length === 0 ? 0 : shouldFreeShip ? 0 : params.shippingFlat;
  const tax = 0;
  const total = Math.max(0, discounted + shipping + tax);

  return { subtotal, discount, shipping, tax, total };
}
