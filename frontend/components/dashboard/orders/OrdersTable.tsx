"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Panel from "@/components/dashboard/cards/Panel";
import { apiFetch, type ApiListResponse, HttpError } from "@/lib/api";
import { formatDateBR, formatMoneyBRL, statusLabel, statusTone, type DashboardOrderStatus } from "@/lib/dashboardData";

type ApiOrder = {
  id: string;
  code?: string;
  status: DashboardOrderStatus;
  itemsCount?: number;
  total?: number;
  createdAt?: string;
  totals?: {
    total?: number;
    totalCents?: number;
  };
};

export default function OrdersTable({ compact }: { compact?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState("recent");
  const [orders, setOrders] = useState<ApiOrder[]>([]);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await apiFetch<ApiListResponse<ApiOrder>>("/api/v1/me/orders", {
          query: { limit: 100 },
        });

        if (!active) return;
        setOrders(response.data || []);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar seus pedidos.");
        } else {
          setError("Não foi possível carregar seus pedidos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const sortedOrders = useMemo(() => {
    const rows = [...orders];

    if (sort === "oldest") {
      rows.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sort === "highest") {
      rows.sort((a, b) => {
        const aTotal = a.totals?.totalCents ?? Math.round((a.total || 0) * 100);
        const bTotal = b.totals?.totalCents ?? Math.round((b.total || 0) * 100);
        return bTotal - aTotal;
      });
    } else {
      rows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return compact ? rows.slice(0, 3) : rows;
  }, [compact, orders, sort]);

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-end justify-between gap-4 border-b border-zinc-200 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Pedidos</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">
            {compact ? "Últimos pedidos" : "Histórico de pedidos"}
          </h2>
        </div>

        {compact ? (
          <Link href="/dashboard/pedidos" className="text-sm font-semibold text-zinc-900 underline underline-offset-4">
            Ver tudo
          </Link>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Ordenar:</label>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="highest">Maior valor</option>
            </select>
          </div>
        )}
      </div>

      {loading ? <p className="px-5 py-4 text-sm text-zinc-600 sm:px-6">Carregando pedidos...</p> : null}

      {error ? (
        <p className="mx-5 my-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:mx-6">{error}</p>
      ) : null}

      {!loading && !error && sortedOrders.length === 0 ? (
        <p className="px-5 py-6 text-sm text-zinc-600 sm:px-6">Você ainda não tem pedidos finalizados.</p>
      ) : null}

      {sortedOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead className="bg-zinc-50 text-left">
              <tr className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                <th className="px-5 py-3 sm:px-6">Pedido</th>
                <th className="px-5 py-3 sm:px-6">Data</th>
                <th className="px-5 py-3 sm:px-6">Status</th>
                <th className="px-5 py-3 sm:px-6">Itens</th>
                <th className="px-5 py-3 sm:px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {sortedOrders.map((order) => {
                const totalCents = order.totals?.totalCents ?? Math.round((order.total || 0) * 100);

                return (
                  <tr key={order.id} className="text-sm text-zinc-800">
                    <td className="px-5 py-4 sm:px-6">
                      <span className="font-semibold text-zinc-900">{order.code || order.id.slice(-8)}</span>
                      <div className="mt-1 text-xs text-zinc-500">ID: {order.id}</div>
                    </td>
                    <td className="px-5 py-4 sm:px-6">{formatDateBR(order.createdAt)}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone(
                          order.status,
                        )}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-6">{order.itemsCount ?? 0}</td>
                    <td className="px-5 py-4 text-right font-semibold text-zinc-900 sm:px-6">
                      {formatMoneyBRL(totalCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}
