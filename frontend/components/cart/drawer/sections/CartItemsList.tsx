"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../../CartProvider";
import { clamp, formatMoney } from "@/lib/cart/utils";

export default function CartItemsList() {
  const { items, removeItem, setQty } = useCart();

  return (
    <div className="space-y-4">
      {items.map((it) => {
        const subtotal = it.unitPrice * it.qty;
        const max = it.stock ?? 999;

        return (
          <div
            key={it.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-black/5">
                <Image
                  src={it.imageUrl}
                  alt={it.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {it.name}
                    </p>
                    {it.variant ? (
                      <p className="mt-0.5 truncate text-xs text-zinc-600">
                        {it.variant}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    aria-label={`Remover ${it.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-900">
                    {formatMoney(it.unitPrice)}
                    <span className="ml-1 text-xs font-medium text-zinc-500">/ un</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setQty(it.id, clamp(it.qty - 1, 1, max))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <span className="min-w-[40px] text-center text-sm font-semibold text-zinc-900">
                        {it.qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => setQty(it.id, clamp(it.qty + 1, 1, max))}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-sm font-semibold text-zinc-900">
                      {formatMoney(subtotal)}
                    </div>
                  </div>
                </div>

                {it.stock != null ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Estoque: <span className="font-semibold">{it.stock}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
