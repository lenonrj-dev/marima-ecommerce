"use client";

import CartErrorBanner from "./sections/CartErrorBanner";
import CartEmptyState from "./sections/CartEmptyState";
import CartItemsList from "./sections/CartItemsList";
import CartUpsell from "./sections/CartUpsell";
import CartCrossSell from "./sections/CartCrossSell";
import CartCoupon from "./sections/CartCoupon";
import CartSaveShare from "./sections/CartSaveShare";
import { useCart } from "../CartProvider";

export default function CartDrawerContent() {
  const { items } = useCart();
  const empty = items.length === 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6" style={{ overflowX: "hidden" }}>
      <CartErrorBanner />

      {empty ? (
        <CartEmptyState />
      ) : (
        <div className="space-y-4">
          <CartItemsList />
          <CartUpsell />
          <CartCrossSell />

          <div className="grid gap-3 sm:grid-cols-2">
            <CartCoupon />
            <CartSaveShare />
          </div>
        </div>
      )}
    </div>
  );
}
