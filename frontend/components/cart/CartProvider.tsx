"use client";

export { StoreProvider as CartProvider, useCart, useFavorites } from "@/components/providers/StoreProvider";
export type { CartItem, CartTotals as Totals } from "@/lib/store/cart";
