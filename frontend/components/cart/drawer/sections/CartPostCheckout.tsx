"use client";

import Link from "next/link";
import { Mail, PackageSearch, Repeat2 } from "lucide-react";
import { SITE_COPY } from "@/lib/siteCopy";

export default function CartPostCheckout() {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-900">Pós-compra</p>

      <div className="mt-3 grid gap-2">
        <div className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
          <Mail className="mt-0.5 h-4 w-4 text-zinc-700" />
          <div>
            <p className="text-sm font-semibold text-zinc-900">Follow-up por e-mail</p>
            <p className="text-xs text-zinc-600">Ofertas, recomendações e status do pedido.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
          <PackageSearch className="mt-0.5 h-4 w-4 text-zinc-700" />
          <div>
            <p className="text-sm font-semibold text-zinc-900">Rastreamento</p>
            <p className="text-xs text-zinc-600">
              Acompanhe atualizações de entrega e {SITE_COPY.ctas.trackOrder.toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
          <Repeat2 className="mt-0.5 h-4 w-4 text-zinc-700" />
          <div>
            <p className="text-sm font-semibold text-zinc-900">Troca e cancelamento</p>
            <p className="text-xs text-zinc-600">Política clara e abertura rápida de solicitação.</p>
          </div>
        </div>

        <Link
          href="/central-de-ajuda"
          className="mt-2 inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Central de ajuda
        </Link>
      </div>
    </div>
  );
}
