"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Panel from "@/components/dashboard/cards/Panel";
import { useCart } from "@/components/cart/CartProvider";
import { apiFetch, HttpError } from "@/lib/api";
import { formatDateBR, formatMoneyBRL } from "@/lib/dashboardData";

type SavedCartApiRow = {
  id: string;
  title?: string;
  itemCount?: number;
  createdAt?: string;
  totals?: {
    totalCents?: number;
  };
};

const CART_CHANGED_EVENT = "marima:cart-changed";

export default function SavedCartsPanel({ compact }: { compact?: boolean }) {
  const { open } = useCart();
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<SavedCartApiRow[]>([]);

  useEffect(() => {
    let active = true;

    async function loadSavedCarts() {
      try {
        const response = await apiFetch<{ data: SavedCartApiRow[] }>("/api/v1/me/cart/saved");
        if (!active) return;
        setItems(response.data || []);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar seus carrinhos salvos.");
        } else {
          setError("Não foi possível carregar seus carrinhos salvos.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSavedCarts();

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => (compact ? items.slice(0, 3) : items), [compact, items]);

  async function handleLoadCart(savedCartId: string) {
    setLoadingId(savedCartId);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/me/cart/saved/${savedCartId}/load`, { method: "POST" });
      window.dispatchEvent(new Event(CART_CHANGED_EVENT));
      setSuccess("Carrinho carregado com sucesso.");
      open();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível carregar o carrinho salvo.");
      } else {
        setError("Não foi possível carregar o carrinho salvo.");
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDeleteCart(savedCartId: string) {
    setDeletingId(savedCartId);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/me/cart/saved/${savedCartId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== savedCartId));
      setSuccess("Carrinho salvo removido com sucesso.");
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível remover o carrinho salvo.");
      } else {
        setError("Não foi possível remover o carrinho salvo.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Panel>
      <div className="flex items-end justify-between gap-4 border-b border-zinc-200 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Carrinhos salvos</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">
            {compact ? "Últimos carrinhos salvos" : "Meus carrinhos salvos"}
          </h2>
        </div>

        {compact ? (
          <Link href="/dashboard/carrinhos-salvos" className="text-sm font-semibold text-zinc-900 underline underline-offset-4">
            Ver tudo
          </Link>
        ) : null}
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {loading ? <p className="text-sm text-zinc-600">Carregando carrinhos salvos...</p> : null}

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        ) : null}

        {!loading && visible.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-soft">
            Você ainda não possui carrinhos salvos.
          </div>
        ) : null}

        <div className="grid gap-4">
          {visible.map((saved) => {
            const totalCents = saved.totals?.totalCents ?? 0;
            const itemCount = saved.itemCount ?? 0;

            return (
              <article key={saved.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{saved.title || "Carrinho salvo"}</p>
                    <p className="mt-1 text-xs text-zinc-500">Criado em {formatDateBR(saved.createdAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{formatMoneyBRL(totalCents)}</p>
                </div>

                <p className="mt-2 text-sm text-zinc-600">
                  {itemCount} {itemCount === 1 ? "item" : "itens"} salvos.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleLoadCart(saved.id)}
                    disabled={loadingId === saved.id || deletingId === saved.id}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    {loadingId === saved.id ? "Carregando..." : "Carregar no carrinho"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeleteCart(saved.id)}
                    disabled={loadingId === saved.id || deletingId === saved.id}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    {deletingId === saved.id ? "Removendo..." : "Remover"}
                  </button>

                  <Link
                    href="/checkout"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    Finalizar compra
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
