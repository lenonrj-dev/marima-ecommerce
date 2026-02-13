"use client";

import { formatMoneyBRL, type ShippingMethod } from "@/lib/checkoutData";

type ShippingMethodsProps = {
  methods: ShippingMethod[];
  value: string;
  onChange: (methodId: string) => void;
};

export default function ShippingMethods({ methods, value, onChange }: ShippingMethodsProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">Método de frete</h2>

      <div className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {methods.map((method) => {
          const checked = method.id === value;
          return (
            <label
              key={method.id}
              className={[
                "flex cursor-pointer items-start justify-between gap-4 p-4 transition hover:bg-zinc-50",
                checked ? "bg-zinc-50" : "bg-white",
              ].join(" ")}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={checked}
                  onChange={() => onChange(method.id)}
                  className="mt-1 h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-black/20"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-zinc-900">{method.label}</span>
                  <span className="block text-xs text-zinc-600">{method.eta}</span>
                </span>
              </span>

              <span className="text-sm font-semibold text-zinc-900">
                {method.priceCents === 0 ? "Grátis" : formatMoneyBRL(method.priceCents)}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
