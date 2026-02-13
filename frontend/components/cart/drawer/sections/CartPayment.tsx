"use client";

import { Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { useCart } from "../../CartProvider";

const METHODS = [
  { id: "card", label: "Cartão", icon: CreditCard },
  { id: "pix", label: "PIX", icon: Wallet },
  { id: "boleto", label: "Boleto", icon: Banknote },
  { id: "installments", label: "Parcelado", icon: Landmark },
] as const;

export default function CartPayment() {
  const { checkoutDraft, updateCheckoutDraft } = useCart();

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-900">Pagamento</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {METHODS.map((m) => {
          const active = checkoutDraft.paymentMethod === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => updateCheckoutDraft({ paymentMethod: m.id })}
              className={[
                "flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
              ].join(" ")}
              aria-pressed={active}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-zinc-700">Nome no cartão</span>
          <input
            value={checkoutDraft.cardName}
            onChange={(e) => updateCheckoutDraft({ cardName: e.target.value })}
            placeholder="Seu nome"
            className="mt-1 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-zinc-700">Parcelas</span>
          <select
            value={checkoutDraft.installments}
            onChange={(e) => updateCheckoutDraft({ installments: e.target.value })}
            className="mt-1 h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <option value="1">1x sem juros</option>
            <option value="2">2x</option>
            <option value="3">3x</option>
            <option value="6">6x</option>
            <option value="12">12x</option>
          </select>
        </label>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Placeholder técnico: integração futura com gateway de pagamento.
      </p>
    </div>
  );
}
