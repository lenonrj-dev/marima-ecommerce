"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";

/**
 * Boto/cone para abrir o drawer.
 * Use dentro do seu Navbar/Header.
 */
export default function CartTrigger({ className = "" }: { className?: string }) {
  const { toggle, triggerRef, items } = useCart();
  const count = items.reduce((acc, it) => acc + it.qty, 0);

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      className={["relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition hover :bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        className,
      ].join(" ")}
      aria-label="Abrir carrinho"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-zinc-900 px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}
