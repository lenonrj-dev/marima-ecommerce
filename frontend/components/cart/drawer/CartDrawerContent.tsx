"use client";

import CartErrorBanner from "./sections/CartErrorBanner";
import CartEmptyState from "./sections/CartEmptyState";
import CartItemsList from "./sections/CartItemsList";
import CartUpsell from "./sections/CartUpsell";
import CartCrossSell from "./sections/CartCrossSell";
import CartCoupon from "./sections/CartCoupon";
import CartSaveShare from "./sections/CartSaveShare";
import CartAddress from "./sections/CartAddress";
import CartPayment from "./sections/CartPayment";
import CartPostCheckout from "./sections/CartPostCheckout";
import { useCart } from "../CartProvider";

export default function CartDrawerContent() {
  const { items } = useCart();
  const empty = items.length === 0;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
      <CartErrorBanner />

      {empty ? (
        <CartEmptyState />
      ) : (
        <>
          <CartItemsList />
          <CartUpsell />
          <CartCrossSell />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <CartCoupon />
            <CartSaveShare />
          </div>

          <CartAddress />
          <CartPayment />
          <CartPostCheckout />
        </>
      )}
    </div>
  );
}
