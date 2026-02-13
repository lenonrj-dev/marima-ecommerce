"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cancelPendingMercadoPagoOrder } from "@/lib/payments/mercadoPago";

export default function CheckoutFailurePage() {
  const [message, setMessage] = useState("Cancelando o pedido pendente...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const orderId = sessionStorage.getItem("mp_pending_order_id") || "";

    if (!orderId) {
      setMessage("Pagamento não concluído. Você pode tentar novamente pelo checkout.");
      return;
    }

    let active = true;

    void (async () => {
      try {
        await cancelPendingMercadoPagoOrder(orderId);
        sessionStorage.removeItem("mp_pending_order_id");
        if (!active) return;
        setMessage("Pagamento não concluído. Pedido cancelado com sucesso.");
      } catch {
        if (!active) return;
        setMessage("Pagamento não concluído. Não foi possível cancelar o pedido automaticamente.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Pagamento não concluído</h1>
          <p className="mt-2 text-sm text-zinc-600">{message}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voltar ao checkout
            </Link>
            <Link
              href="/produtos"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voltar para loja
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
