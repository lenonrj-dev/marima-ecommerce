"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { useCart } from "../../CartProvider";

export default function CartCoupon() {
  const { applyCoupon, coupon } = useCart();
  const [code, setCode] = useState(coupon ?? "");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-900">Cupom</p>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: MARIMA10"
            className="h-11 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
          />
        </div>
        <button
          type="button"
          onClick={() => applyCoupon(code)}
          className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Aplicar cupom
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-500">Simulação: MARIMA10 (10% OFF) • FRETEGRATIS</p>
    </div>
  );
}

