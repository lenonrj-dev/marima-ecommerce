"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/components/cart/CartProvider";

type SharedItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  qty: number;
  unitPriceCents: number;
};

type SharedCartPayload = {
  token: string;
  itemCount: number;
  expiresAt?: string;
  items: SharedItem[];
  totals: {
    totalCents: number;
  };
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function SharedCartClient({ token }: { token: string }) {
  const { importSharedCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedCartPayload | null>(null);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setImported(false);

    void (async () => {
      try {
        const response = await apiFetch<{ data: SharedCartPayload }>(`/api/v1/cart/shared/${token}`);
        if (!active) return;
        setData(response.data);
      } catch {
        if (!active) return;
        setError("Não foi possível carregar este carrinho compartilhado.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const expiresLabel = useMemo(() => {
    if (!data?.expiresAt) return null;
    const parsed = new Date(data.expiresAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString("pt-BR");
  }, [data?.expiresAt]);

  async function handleImport() {
    setImporting(true);
    setError(null);

    const ok = await importSharedCart(token);
    setImporting(false);

    if (ok) {
      setImported(true);
      return;
    }

    setError("Não foi possível importar este carrinho agora.");
  }

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-800">
            <Share2 className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-center text-2xl font-semibold text-zinc-900">Carrinho compartilhado</h1>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Revise os itens e importe para continuar sua compra.
          </p>

          {loading ? (
            <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando carrinho compartilhado...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
              {error}
            </div>
          ) : null}

          {!loading && data ? (
            <>
              <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                <h2 className="text-sm font-semibold text-zinc-900">Resumo</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-zinc-500">Itens</dt>
                    <dd className="font-medium text-zinc-900">{data.itemCount}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-zinc-500">Total estimado</dt>
                    <dd className="font-medium text-zinc-900">{formatMoney(data.totals?.totalCents || 0)}</dd>
                  </div>
                  {expiresLabel ? (
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">Válido até</dt>
                      <dd className="font-medium text-zinc-900">{expiresLabel}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-200 p-4 sm:p-5">
                <h2 className="text-sm font-semibold text-zinc-900">Itens do carrinho</h2>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                  {data.items.slice(0, 6).map((item) => (
                    <li key={`${item.productId}-${item.slug}`} className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {item.name} <span className="text-zinc-500">x{item.qty}</span>
                      </span>
                      <span className="shrink-0 font-medium">{formatMoney(item.unitPriceCents * item.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={importing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Importar para meu carrinho
                </button>
                <Link
                  href="/produtos"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  Continuar comprando
                </Link>
              </div>

              {imported ? (
                <p className="mt-3 text-sm text-emerald-700" role="status" aria-live="polite">
                  Carrinho importado com sucesso. Você já pode finalizar a compra.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
