"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cancelPendingMercadoPagoOrder } from "@/lib/payments/mercadoPago";
import { buildLoginUrl, isAuthenticated } from "@/lib/authSession";

function formatMoney(value?: string) {
  if (!value) return "Pedido registrado";
  const numeric = Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return "Pedido registrado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric);
}

function failureStatusLabel(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "failure" || normalized === "rejected" || normalized === "cancelled") {
    return "Não aprovado";
  }
  if (normalized === "pending" || normalized === "pendente") return "Pendente";
  return "Não aprovado";
}

function CheckoutFailureContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Seu pagamento não foi aprovado ou foi cancelado.");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const summaryOrderId = useMemo(
    () =>
      searchParams.get("orderId") ||
      searchParams.get("order_id") ||
      searchParams.get("external_reference") ||
      searchParams.get("merchant_order_id") ||
      undefined,
    [searchParams],
  );

  const summaryTotal = useMemo(
    () => searchParams.get("total") || searchParams.get("amount") || searchParams.get("transaction_amount") || undefined,
    [searchParams],
  );

  const summaryStatus = useMemo(() => searchParams.get("status") || "failure", [searchParams]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const orderId = sessionStorage.getItem("mp_pending_order_id") || "";

    if (!orderId) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        await cancelPendingMercadoPagoOrder(orderId);
        sessionStorage.removeItem("mp_pending_order_id");
        if (!active) return;
        setMessage("Seu pagamento não foi aprovado ou foi cancelado. O pedido pendente foi atualizado automaticamente.");
      } catch {
        if (!active) return;
        setMessage("Seu pagamento não foi aprovado ou foi cancelado. Não foi possível atualizar o pedido automaticamente.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </div>

          <h1 className="mt-4 text-center text-2xl font-semibold text-zinc-900">Não foi possível concluir o pagamento</h1>
          <p className="mt-2 text-center text-sm text-zinc-600">{message}</p>

          <div className="mt-6 rounded-xl border border-zinc-200 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900">Causas comuns</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
              <li>Saldo insuficiente ou limite indisponível no método de pagamento.</li>
              <li>Dados de pagamento divergentes ou bloqueio de segurança.</li>
              <li>Cancelamento da operação antes da confirmação final.</li>
            </ul>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900">Resumo do pedido</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Número do pedido</dt>
                <dd className="font-medium text-zinc-900">{summaryOrderId || "Pedido registrado"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Total</dt>
                <dd className="font-medium text-zinc-900">{formatMoney(summaryTotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-medium text-rose-700">{failureStatusLabel(summaryStatus)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Tentar novamente
            </Link>
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voltar ao carrinho
            </Link>
            <Link
              href="/dashboard/pedidos"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Ver meus pedidos
            </Link>
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

export default function CheckoutFailurePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] bg-white">
          <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-soft sm:p-8">
              Carregando informações do pedido...
            </div>
          </section>
        </main>
      }
    >
      <CheckoutFailureContent />
    </Suspense>
  );
}
