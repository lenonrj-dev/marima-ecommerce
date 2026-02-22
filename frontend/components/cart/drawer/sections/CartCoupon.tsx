"use client";

import { useMemo, useState } from "react";
import { Loader2, Ticket, XCircle } from "lucide-react";
import { useCart } from "../../CartProvider";

export default function CartCoupon() {
  const {
    applyCoupon,
    removeCoupon,
    coupon,
    couponLoading,
    couponStatus,
    error,
    setError,
  } = useCart();
  const [code, setCode] = useState(coupon ?? "");

  const statusText = useMemo(() => {
    if (couponLoading) return "Aplicando cupom...";
    if (couponStatus === "success" && coupon) return `Cupom ${coupon} aplicado com sucesso.`;
    if (couponStatus === "error") return error || "Não foi possível aplicar o cupom.";
    return null;
  }, [coupon, couponLoading, couponStatus, error]);

  const isError = couponStatus === "error";

  async function handleApply() {
    await applyCoupon(code);
  }

  async function handleRemove() {
    await removeCoupon();
    setError(null);
    setCode("");
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5" aria-labelledby="cart-coupon-title">
      <div className="flex items-center justify-between gap-3">
        <p id="cart-coupon-title" className="text-sm font-semibold text-zinc-900">
          Cupom de desconto
        </p>

        {coupon ? (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={couponLoading}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <XCircle className="h-3.5 w-3.5" />
            Remover
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            aria-label="Código do cupom"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Ex: MARIMA10"
            className="h-11 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={couponLoading}
          className="inline-flex h-11 min-w-[132px] items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Aplicar cupom
        </button>
      </div>

      {statusText ? (
        <p
          role="status"
          aria-live="polite"
          className={[
            "mt-2 text-xs",
            isError ? "text-rose-600" : coupon ? "text-emerald-700" : "text-zinc-500",
          ].join(" ")}
        >
          {statusText}
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Use um cupom válido para aplicar desconto no pedido.</p>
      )}
    </section>
  );
}
