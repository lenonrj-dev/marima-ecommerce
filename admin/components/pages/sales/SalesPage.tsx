"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, cn } from "../../dashboard/ui";
import AbandonedCartsTable from "./AbandonedCartsTable";
import OrderDetailsModal from "./OrderDetailsModal";
import OrdersTable from "./OrdersTable";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import type { AbandonedCart, Order } from "../../../lib/types";

export default function SalesPage() {
  const [tab, setTab] = useState<"pedidos" | "carrinhos">("pedidos");
  const [orders, setOrders] = useState<Order[]>([]);
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cartActionId, setCartActionId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [ordersRes, cartsRes] = await Promise.all([
        apiFetch<ApiListResponse<Order>>("/api/v1/admin/orders", { query: { limit: 300 } }),
        apiFetch<ApiListResponse<AbandonedCart>>("/api/v1/admin/abandoned-carts", { query: { limit: 300 } }),
      ]);

      setOrders(ordersRes.data || []);
      setCarts(cartsRes.data || []);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível carregar vendas.");
      } else {
        setError("Não foi possível carregar vendas.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const totalPedidos = orders.length;
    const pagos = orders.filter((order) => order.status === "pago").length;
    const pendentes = orders.filter((order) => order.status === "pendente").length;
    const abandonados = carts.filter((cart) => !cart.recovered).length;
    return { totalPedidos, pagos, pendentes, abandonados };
  }, [orders, carts]);

  async function handleUpdateOrderStatus(id: string, status: Order["status"]) {
    setUpdatingStatus(true);
    setError(null);

    try {
      const response = await apiFetch<{ data: Order }>(`/api/v1/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setOrders((previous) => previous.map((item) => (item.id === id ? response.data : item)));
      setSelected(response.data);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível atualizar o status do pedido.");
      } else {
        setError("Não foi possível atualizar o status do pedido.");
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleRecoverCart(id: string) {
    setCartActionId(id);
    setError(null);

    try {
      await apiFetch(`/api/v1/admin/abandoned-carts/${id}/recover`, {
        method: "POST",
        body: JSON.stringify({ note: "Recuperação iniciada pelo time comercial." }),
      });

      await loadData();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível recuperar o carrinho.");
      } else {
        setError("Não foi possível recuperar o carrinho.");
      }
    } finally {
      setCartActionId(null);
    }
  }

  async function handleConvertCart(id: string) {
    setCartActionId(id);
    setError(null);

    try {
      await apiFetch(`/api/v1/admin/abandoned-carts/${id}/convert-order`, {
        method: "POST",
      });

      await loadData();
      setTab("pedidos");
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível converter o carrinho em pedido.");
      } else {
        setError("Não foi possível converter o carrinho em pedido.");
      }
    } finally {
      setCartActionId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Vendas</h1>
          <p className="mt-1 text-sm text-slate-500">Pedidos e carrinhos abandonados com foco em recuperação.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setTab("carrinhos")}>Automatizar recuperação</Button>
          <Button variant="primary" onClick={() => setTab("pedidos")}>Pedidos</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Pedidos" subtitle="Total" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{summary.totalPedidos}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Pagos" subtitle="Aprovados" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{summary.pagos}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Pendentes" subtitle="Aguardando" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{summary.pendentes}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Carrinhos" subtitle="Em aberto" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{summary.abandonados}</p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title={tab === "pedidos" ? "Pedidos" : "Carrinhos abandonados"}
          subtitle={
            tab === "pedidos"
              ? "Clique em um pedido para ver detalhes."
              : "Recupere vendas com automações e cupons."
          }
          right={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("pedidos")}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                  tab === "pedidos"
                    ? "bg-violet-100 text-violet-700"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                Pedidos
              </button>
              <button
                type="button"
                onClick={() => setTab("carrinhos")}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                  tab === "carrinhos"
                    ? "bg-violet-100 text-violet-700"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                Carrinhos
              </button>
              <Badge tone="neutral">Backend</Badge>
            </div>
          }
        />
        <CardBody>
          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : tab === "pedidos" ? (
            <OrdersTable orders={orders} onOpen={(order) => setSelected(order)} />
          ) : (
            <AbandonedCartsTable
              carts={carts}
              onRecover={handleRecoverCart}
              onConvert={handleConvertCart}
              loadingActionId={cartActionId}
            />
          )}
        </CardBody>
      </Card>

      <OrderDetailsModal
        key={selected?.id ?? "empty"}
        open={!!selected}
        onClose={() => setSelected(null)}
        order={selected}
        onUpdateStatus={handleUpdateOrderStatus}
        updating={updatingStatus}
      />
    </div>
  );
}
