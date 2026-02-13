"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { SITE_COPY } from "@/lib/siteCopy";

export default function CartEmptyState() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-white">
        <ShoppingBag className="h-5 w-5" />
      </div>
      <p className="mt-4 text-lg font-semibold text-zinc-900">
        Seu carrinho está vazio. Comece a comprar.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        Adicione produtos para ver recomendações e calcular o total.
      </p>
      <Link
        href="/produtos"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      >
        {SITE_COPY.ctas.viewCollection}
      </Link>
    </div>
  );
}


