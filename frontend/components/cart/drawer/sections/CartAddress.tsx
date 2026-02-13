"use client";

import { MapPin } from "lucide-react";
import { useCart } from "../../CartProvider";
import { SITE_COPY } from "@/lib/siteCopy";

export default function CartAddress() {
  const { checkoutDraft, updateCheckoutDraft } = useCart();

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">Entrega</p>
        <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
          <MapPin className="h-4 w-4" />
          Endereço
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-zinc-700">CEP</span>
          <input
            value={checkoutDraft.zip}
            onChange={(e) => updateCheckoutDraft({ zip: e.target.value })}
            placeholder="00000-000"
            className="mt-1 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-zinc-700">Cidade</span>
          <input
            value={checkoutDraft.city}
            onChange={(e) => updateCheckoutDraft({ city: e.target.value })}
            placeholder="Sua cidade"
            className="mt-1 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-zinc-700">Endereço</span>
          <input
            value={checkoutDraft.address}
            onChange={(e) => updateCheckoutDraft({ address: e.target.value })}
            placeholder="Rua, número e bairro"
            className="mt-1 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
          />
        </label>
      </div>

      <button
        type="button"
        className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      >
        {SITE_COPY.ctas.calculateShipping}
      </button>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-zinc-50 p-3">
        <input
          id="lgpd"
          type="checkbox"
          checked={checkoutDraft.lgpdConsent}
          onChange={(e) => updateCheckoutDraft({ lgpdConsent: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900"
        />
        <label htmlFor="lgpd" className="text-xs text-zinc-600">
          Concordo com o tratamento de dados (LGPD) para entrega e processamento do pedido.
        </label>
      </div>
    </div>
  );
}
