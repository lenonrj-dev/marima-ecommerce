"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoneyBRL } from "@/lib/checkoutData";

function QtyButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
        disabled
          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
          : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
      ].join(" ")}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export default function OrderSummary({ shippingCents }: { shippingCents: number }) {
  const { items, totals, setQty, removeItem, clear } = useCart();

  const subtotal = totals.subtotal;
  const discount = totals.discount;
  const tax = totals.tax;
  const total = Math.max(0, subtotal - discount + shippingCents + tax);

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">Resumo do pedido</p>
            <p className="text-xs text-zinc-500">Revise itens e quantidades antes de pagar.</p>
          </div>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-semibold text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
            >
              Limpar carrinho
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              Seu carrinho está vazio.
              <Link href="/produtos" className="ml-1 font-semibold underline underline-offset-4">
                Voltar para loja
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-xl border border-zinc-200 p-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-zinc-100">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{item.name}</p>
                      {item.variant ? <p className="mt-0.5 truncate text-xs text-zinc-500">{item.variant}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                      aria-label={`Remover ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-900">{formatMoneyBRL(item.unitPrice)}</p>

                    <div className="flex items-center gap-2">
                      <QtyButton
                        label="Diminuir quantidade"
                        disabled={item.qty <= 1}
                        onClick={() => setQty(item.id, item.qty - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </QtyButton>
                      <span className="min-w-[28px] text-center text-sm font-semibold text-zinc-900">
                        {item.qty}
                      </span>
                      <QtyButton
                        label="Aumentar quantidade"
                        disabled={item.qty >= item.stock}
                        onClick={() => setQty(item.id, item.qty + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </QtyButton>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-600">
                    <span>Subtotal do item</span>
                    <span className="font-semibold text-zinc-800">
                      {formatMoneyBRL(item.unitPrice * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="font-semibold text-zinc-900">{formatMoneyBRL(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Desconto</span>
              <span className="font-semibold text-zinc-900">- {formatMoneyBRL(discount)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Frete</span>
              <span className="font-semibold text-zinc-900">{formatMoneyBRL(shippingCents)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>Impostos (estimado)</span>
              <span className="font-semibold text-zinc-900">{formatMoneyBRL(tax)}</span>
            </div>

            <div className="mt-3 h-px w-full bg-zinc-200" aria-hidden />

            <div className="flex items-end justify-between">
              <p className="text-sm font-semibold text-zinc-900">Total</p>
              <p className="text-xl font-semibold tracking-tight text-zinc-900">{formatMoneyBRL(total)}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
