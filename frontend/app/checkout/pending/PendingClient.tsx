"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type VerifyResponse = {
  data: {
    ok: true;
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
  };
};

export default function PendingClient({
  paymentId,
  externalReference,
  merchantOrderId,
}: {
  paymentId: string;
  externalReference?: string;
  merchantOrderId?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "pending" | "error">("idle");
  const [message, setMessage] = useState("Pagamento pendente. Você pode verificar novamente em alguns instantes.");

  const verify = useCallback(async () => {
    if (!paymentId) {
      setState("error");
      setMessage("Não recebemos o ID do pagamento para verificar. Tente novamente pelo checkout.");
      return;
    }

    setState("loading");
    setMessage("Verificando pagamento...");

    try {
      const response = await apiFetch<VerifyResponse>("/api/v1/payments/mercadopago/verify", {
        query: {
          payment_id: paymentId,
          external_reference: externalReference || undefined,
          merchant_order_id: merchantOrderId || undefined,
        },
      });

      const paymentStatus = response.data.paymentStatus;

      if (paymentStatus === "approved") {
        const qs = new URLSearchParams();
        qs.set("payment_id", paymentId);
        if (externalReference) qs.set("external_reference", externalReference);
        router.replace(`/checkout/success?${qs.toString()}`);
        return;
      }

      if (paymentStatus === "pending") {
        setState("pending");
        setMessage("Pagamento ainda está pendente. Verifique novamente em alguns instantes.");
        return;
      }

      const qs = new URLSearchParams();
      qs.set("payment_id", paymentId);
      if (externalReference) qs.set("external_reference", externalReference);
      router.replace(`/checkout/failure?${qs.toString()}`);
    } catch {
      setState("error");
      setMessage("Não foi possível verificar o pagamento agora. Tente novamente em alguns instantes.");
    }
  }, [externalReference, merchantOrderId, paymentId, router]);

  useEffect(() => {
    void verify();
  }, [verify]);

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Pagamento pendente</h1>
          <p className="mt-2 text-sm text-zinc-600">{message}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void verify()}
              disabled={state === "loading"}
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Verificar novamente
            </button>
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voltar ao checkout
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

