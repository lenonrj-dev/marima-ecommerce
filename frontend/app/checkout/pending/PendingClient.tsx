"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { buildLoginUrl, isAuthenticated } from "@/lib/authSession";

type VerifyResponse = {
  data: {
    ok: true;
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
  };
};

function formatMoney(value?: string) {
  if (!value) return "Pedido registrado";
  const numeric = Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return "Pedido registrado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric);
}

function statusLabel(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "pending" || normalized === "pendente") return "Pendente";
  if (normalized === "approved" || normalized === "aprovado") return "Confirmado / Aprovado";
  if (normalized === "cancelled" || normalized === "canceled" || normalized === "cancelado") return "Cancelado";
  if (normalized === "rejected" || normalized === "recusado") return "Não aprovado";
  return "Pendente";
}

export default function PendingClient({
  paymentId,
  externalReference,
  merchantOrderId,
  orderId,
  totalPaid,
}: {
  paymentId: string;
  externalReference?: string;
  merchantOrderId?: string;
  orderId?: string;
  totalPaid?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "pending" | "error">("idle");
  const [message, setMessage] = useState("Estamos aguardando a confirmação do pagamento.");
  const [summaryOrderId, setSummaryOrderId] = useState<string | undefined>(orderId || externalReference);
  const [summaryStatus, setSummaryStatus] = useState<string>("pending");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      const authed = await isAuthenticated();
      if (!active) return;
      setLoggedIn(authed);
      setSessionChecked(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  const verify = useCallback(async () => {
    if (!paymentId) {
      setState("error");
      setMessage("Pedido registrado. Não recebemos um identificador de pagamento para consulta.");
      return;
    }

    setState("loading");
    setMessage("Estamos aguardando a confirmação do pagamento.");

    try {
      const response = await apiFetch<VerifyResponse>("/api/v1/payments/mercadopago/verify", {
        query: {
          payment_id: paymentId,
          external_reference: externalReference || undefined,
          merchant_order_id: merchantOrderId || undefined,
        },
      });

      const paymentStatus = response.data.paymentStatus;
      setSummaryOrderId(response.data.orderId || summaryOrderId);
      setSummaryStatus(response.data.orderStatus || paymentStatus);

      if (paymentStatus === "approved") {
        const qs = new URLSearchParams();
        qs.set("payment_id", paymentId);
        if (externalReference) qs.set("external_reference", externalReference);
        router.replace(`/checkout/success?${qs.toString()}`);
        return;
      }

      if (paymentStatus === "pending") {
        setState("pending");
        setMessage("Estamos aguardando a confirmação do pagamento.");
        return;
      }

      const qs = new URLSearchParams();
      qs.set("payment_id", paymentId);
      if (externalReference) qs.set("external_reference", externalReference);
      router.replace(`/checkout/failure?${qs.toString()}`);
    } catch {
      setState("error");
      setMessage("Pedido registrado. Não foi possível atualizar o status neste momento.");
    }
  }, [externalReference, merchantOrderId, paymentId, router, summaryOrderId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void verify();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [verify]);

  const handleRefreshStatus = async () => {
    router.refresh();
    await verify();
  };

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>

          <h1 className="mt-4 text-center text-2xl font-semibold text-zinc-900">Pagamento pendente</h1>
          <p className="mt-2 text-center text-sm text-zinc-600">{message}</p>
          <p className="mt-1 text-center text-sm text-zinc-500">Alguns meios podem levar alguns minutos para confirmar.</p>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900">Resumo do pedido</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Número do pedido</dt>
                <dd className="font-medium text-zinc-900">{summaryOrderId || "Pedido registrado"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Total</dt>
                <dd className="font-medium text-zinc-900">{formatMoney(totalPaid)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-medium text-amber-700">{statusLabel(summaryStatus)}</dd>
              </div>
            </dl>
          </div>

          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Se o pagamento não for confirmado, o pedido pode ser cancelado automaticamente.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/pedidos"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Ver meus pedidos
            </Link>
            <button
              type="button"
              onClick={() => void handleRefreshStatus()}
              disabled={state === "loading"}
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Atualizar status
            </button>
          </div>

          <p className="mt-5 text-sm text-zinc-600">
            Precisa de ajuda?{" "}
            <Link className="font-semibold text-zinc-900 underline underline-offset-4" href="/central-de-ajuda">
              Falar com suporte
            </Link>
          </p>

          {sessionChecked && !loggedIn ? (
            <p className="mt-3 text-sm text-zinc-600">
              Faça login para acompanhar seu pedido na sua conta.{" "}
              <Link
                className="font-semibold text-zinc-900 underline underline-offset-4"
                href={buildLoginUrl("/dashboard/pedidos")}
              >
                Entrar na conta
              </Link>
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
