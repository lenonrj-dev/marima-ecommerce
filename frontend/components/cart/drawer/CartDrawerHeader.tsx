"use client";

import { ShoppingBag, X } from "lucide-react";
import { useMemo } from "react";
import { useCart } from "../CartProvider";

export default function CartDrawerHeader({
  closeBtnRef,
}: {
  closeBtnRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { close, items } = useCart();

  const itemCount = useMemo(() => items.reduce((acc, item) => acc + item.qty, 0), [items]);

  return (
    <header className="shrink-0 flex items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-900 text-white">
          <ShoppingBag className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-zinc-900">Seu carrinho</h2>
          <p className="text-xs text-zinc-600">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </p>
        </div>
      </div>

      <button
        ref={closeBtnRef}
        type="button"
        onClick={close}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        aria-label="Fechar carrinho"
      >
        <X className="h-5 w-5" />
      </button>
    </header>
  );
}
