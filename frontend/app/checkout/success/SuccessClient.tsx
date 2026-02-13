"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/components/cart/CartProvider";

type VerifyResponse = {
  data: {
    ok: true;
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
  };
};

export default function SuccessClient({
  paymentId,
  status,
  externalReference,
  merchantOrderId,
}: {
  paymentId: string;
  status?: string;
  externalReference?: string;
  merchantOrderId?: string;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando pagamento...");

  useEffect(() => {
    if (!paymentId) {
      setState("error");
      setMessage("Não recebemos a confirmação do pagamento. Tente verificar novamente.");
      return;
    }

    let active = true;

    void (async () => {
      try {
        const response = await apiFetch<VerifyResponse>("/api/v1/payments/mercadopago/verify", {
          query: {
            payment_id: paymentId,
            status: status || undefined,
            external_reference: externalReference || undefined,
            merchant_order_id: merchantOrderId || undefined,
          },
        });

        if (!active) return;

        const paymentStatus = response.data.paymentStatus;

        if (paymentStatus === "approved") {
          clear();

          try {
            sessionStorage.removeItem("mp_pending_order_id");
            sessionStorage.removeItem("mp_pending_cancel_token");
          } catch {
            // ignore
          }

          setState("success");
          setMessage("Pagamento confirmado. Seu pedido foi aprovado.");
          return;
        }

        if (paymentStatus === "pending") {
          const qs = new URLSearchParams();
          qs.set("payment_id", paymentId);
          if (externalReference) qs.set("external_reference", externalReference);
          router.replace(`/checkout/pending?${qs.toString()}`);
          return;
        }

        const qs = new URLSearchParams();
        qs.set("payment_id", paymentId);
        if (externalReference) qs.set("external_reference", externalReference);
        router.replace(`/checkout/failure?${qs.toString()}`);
      } catch {
        if (!active) return;
        setState("error");
        setMessage("Não foi possível verificar o pagamento agora. Tente novamente em alguns instantes.");
      }
    })();

    return () => {
      active = false;
    };
  }, [clear, externalReference, merchantOrderId, paymentId, router, status]);

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            {state === "success" ? "Compra aprovada" : "Finalizando pagamento"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{message}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/produtos"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voltar para loja
            </Link>
            {state === "error" ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                Verificar novamente
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

