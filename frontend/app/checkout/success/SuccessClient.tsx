"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/components/cart/CartProvider";
import { buildLoginUrl, isAuthenticated } from "@/lib/authSession";

type VerifyResponse = {
  data: {
    ok: true;
    orderId: string;
    orderStatus: string;
    paymentStatus: string;
  };
};

type CheckoutSummary = {
  orderId?: string;
  totalPaid?: string;
  paidAt?: string;
  status?: string;
};

function toStatusLabel(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Confirmado / Aprovado";
  if (normalized === "approved" || normalized === "aprovado" || normalized === "pago") return "Confirmado / Aprovado";
  if (normalized === "pending" || normalized === "pendente") return "Pendente";
  if (normalized === "cancelled" || normalized === "canceled" || normalized === "cancelado") return "Cancelado";
  if (normalized === "rejected" || normalized === "recusado" || normalized === "failure") return "Não aprovado";
  return "Confirmado / Aprovado";
}

function formatMoney(value?: string) {
  if (!value) return "Pedido registrado";
  const numeric = Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return "Pedido registrado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric);
}

function formatDateTime(value?: string) {
  if (!value) return "Pedido registrado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Pedido registrado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(parsed);
}

export default function SuccessClient({
  paymentId,
  status,
  externalReference,
  merchantOrderId,
  orderId,
  totalPaid,
  paidAt,
}: {
  paymentId: string;
  status?: string;
  externalReference?: string;
  merchantOrderId?: string;
  orderId?: string;
  totalPaid?: string;
  paidAt?: string;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const [state, setState] = useState<"loading" | "success" | "error">(paymentId ? "loading" : "error");
  const [message, setMessage] = useState(
    paymentId
      ? "Estamos validando a confirmação do seu pagamento."
      : "Seu pedido foi registrado. Atualize o status para confirmar o pagamento.",
  );
  const [summary, setSummary] = useState<CheckoutSummary>({
    orderId,
    totalPaid,
    paidAt,
    status: status || "approved",
  });
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

  useEffect(() => {
    if (!paymentId) {
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
          } catch {
            // ignore
          }

          setState("success");
          setSummary((current) => ({
            ...current,
            orderId: response.data.orderId || current.orderId,
            status: response.data.orderStatus || response.data.paymentStatus || current.status,
          }));
          setMessage("Seu pedido foi confirmado e já está em processamento.");
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
        setMessage("Seu pedido foi registrado. Não foi possível validar o pagamento agora.");
      }
    })();

    return () => {
      active = false;
    };
  }, [clear, externalReference, merchantOrderId, paymentId, router, status]);

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className="mt-4 text-center text-2xl font-semibold text-zinc-900">Pagamento aprovado!</h1>
          <p className="mt-2 text-center text-sm text-zinc-600">{message}</p>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900">Resumo do pedido</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Número do pedido</dt>
                <dd className="font-medium text-zinc-900">{summary.orderId || "Pedido registrado"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Total pago</dt>
                <dd className="font-medium text-zinc-900">{formatMoney(summary.totalPaid)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Data e hora</dt>
                <dd className="font-medium text-zinc-900">{formatDateTime(summary.paidAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-medium text-emerald-700">{toStatusLabel(summary.status)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900">Próximos passos</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
              <li>Acompanhe o status do seu pedido na área de pedidos.</li>
              <li>Receba atualizações na sua conta durante o processamento e envio.</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/pedidos"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Acompanhar pedido
            </Link>
            <Link
              href="/produtos"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Continuar comprando
            </Link>
            {state === "error" ? (
              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                Atualizar status
              </button>
            ) : null}
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
