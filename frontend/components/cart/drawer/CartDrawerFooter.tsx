"use client";

import Link from "next/link";
import { CreditCard, Gift, Lock, Truck } from "lucide-react";
import { useCart } from "../CartProvider";
import { formatMoney } from "@/lib/cart/utils";
import { SITE_COPY } from "@/lib/siteCopy";

export default function CartDrawerFooter() {
  const { totals, isQuoting, items, close, clear, startCheckout } = useCart();
  const empty = items.length === 0;

  return (
    <footer className="sticky bottom-0 shrink-0 border-t border-zinc-200 bg-white px-4 py-4 sm:px-6" style={{ overflowX: "hidden" }}>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-600">Subtotal</span>
          <span className="font-semibold text-zinc-900">{formatMoney(totals.subtotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-600">Desconto</span>
          <span className="font-semibold text-zinc-900">- {formatMoney(totals.discount)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-zinc-600">
            <Truck className="h-4 w-4" />
            Frete
          </span>
          <span className="font-semibold text-zinc-900">{formatMoney(totals.shipping)}</span>
        </div>

      </div>

      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
        <span className="font-semibold text-zinc-900">Total</span>
        <span className="text-lg font-semibold text-zinc-900">{formatMoney(totals.total)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Lock className="h-4 w-4" />
        SSL seguro • finalização protegida
        {isQuoting ? <span className="sm:ml-auto">recalculando...</span> : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          href="/produtos"
          className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {SITE_COPY.ctas.continueShopping}
        </Link>

        <button
          type="button"
          onClick={startCheckout}
          disabled={empty}
          className={[
            "inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
            empty ? "cursor-not-allowed bg-zinc-400" : "bg-zinc-900 hover:bg-zinc-800",
          ].join(" ")}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {SITE_COPY.ctas.checkout}
        </button>
      </div>

      {!empty ? (
        <button
          type="button"
          onClick={clear}
          className="mt-3 inline-flex text-xs font-semibold text-zinc-600 underline underline-offset-4 transition hover:text-zinc-900"
        >
          Limpar carrinho
        </button>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Gift className="h-4 w-4" />
          Frete grátis acima de {formatMoney(29900)}
        </span>

        <button
          type="button"
          onClick={close}
          className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-zinc-700"
        >
          Fechar
        </button>
      </div>
    </footer>
  );
}
