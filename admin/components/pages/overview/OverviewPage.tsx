"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import { MiniBars, MiniLine } from "../../dashboard/MiniCharts";
import { formatBRL, formatCategoryLabel, formatCompactNumber, formatDateShort, formatPct } from "../../../lib/format";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import { orderStatusLabel, orderStatusTone, productStatusLabel, productStatusTone } from "../../../lib/status";
import type { Order, OverviewMetrics, Product } from "../../../lib/types";

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

export default function OverviewPage() {
  const [period, setPeriod] = useState("30");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    revenue: 0,
    orders: 0,
    customers: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    clicks: 0,
    emailsSent: 0,
    lowStock: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<Array<{ date: string; value: number }>>([]);

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      setLoading(true);
      setError(null);

      try {
        const [overviewRes, seriesRes, ordersRes, lowStockRes, featuredRes] = await Promise.all([
          apiFetch<{ data: OverviewMetrics }>("/api/v1/admin/analytics/overview", { query: { period } }),
          apiFetch<{ data: Array<{ date: string; value: number }> }>("/api/v1/admin/analytics/revenue-series", {
            query: { days: 14 },
          }),
          apiFetch<ApiListResponse<Order>>("/api/v1/admin/orders", {
            query: {
              q: q.trim() || undefined,
              limit: 20,
            },
          }),
          apiFetch<ApiListResponse<Product>>("/api/v1/admin/inventory/items", {
            query: {
              lowStockOnly: true,
              limit: 10,
            },
          }),
          apiFetch<ApiListResponse<Product>>("/api/v1/admin/products", {
            query: { limit: 3 },
          }),
        ]);

        if (!active) return;

        setMetrics(overviewRes.data);
        setRevenueSeries(seriesRes.data || []);
        setOrders((ordersRes.data || []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
        setLowStock((lowStockRes.data || []).sort((a, b) => a.stock - b.stock));
        setFeatured((featuredRes.data || []).slice(0, 3));
      } catch (err) {
        if (!active) return;

        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar o overview.");
        } else {
          setError("Não foi possível carregar o overview.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      active = false;
    };
  }, [period, q]);

  const series = useMemo(() => revenueSeries.map((point) => point.value), [revenueSeries]);
  const bars = useMemo(() => series.slice(-10).map((value) => Math.max(1, Math.round(value / 80))), [series]);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Início</h1>
          <p className="mt-1 text-sm text-slate-500">Resumo operacional do e-commerce com dados reais do backend.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Selecionar período"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            options={PERIODS}
          />
          <Button variant="secondary" onClick={() => setQ("")}>Limpar busca</Button>
          <Button variant="primary" onClick={() => window.location.assign("/reports")}>Exportar</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Receita" subtitle={`Período: ${period} dias`} right={<Badge tone="success">+8%</Badge>} />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{formatBRL(metrics.revenue)}</p>
            <p className="mt-2 text-xs text-slate-500">Ticket médio: {formatBRL(metrics.avgOrderValue)}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pedidos" subtitle="Total" right={<Badge tone="info">Hoje</Badge>} />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{formatCompactNumber(metrics.orders)}</p>
            <p className="mt-2 text-xs text-slate-500">Pagos, enviados e entregues</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Conversão" subtitle="Clientes para compra" right={<Badge tone="neutral">Meta 3%</Badge>} />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{formatPct(metrics.conversionRate)}</p>
            <p className="mt-2 text-xs text-slate-500">Clientes ativos: {formatCompactNumber(metrics.customers)}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Estoque baixo" subtitle="Itens críticos" right={<Badge tone="warn">Atenção</Badge>} />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{formatCompactNumber(metrics.lowStock)}</p>
            <p className="mt-2 text-xs text-slate-500">Itens com necessidade de reposição</p>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader
            title="Receita (tendência)"
            subtitle="Evolução visual para análise rápida"
            right={<Badge tone="neutral">Atualizado</Badge>}
          />
          <CardBody className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
              <p className="text-xs text-slate-500">Série de 14 dias</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Baseada em pedidos pagos</p>
              <MiniLine values={series.length ? series : [0, 0, 0, 0]} />
              <p className="mt-1 text-xs text-slate-500">Receita real do período selecionado.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
              <p className="text-xs text-slate-500">Distribuição diária</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Últimos 10 dias</p>
              <MiniBars values={bars.length ? bars : [1, 1, 1, 1]} />
              <p className="mt-1 text-xs text-slate-500">Variação diária de faturamento.</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Estoque"
            subtitle="Produtos com alerta"
            right={<Badge tone={metrics.lowStock ? "warn" : "success"}>{metrics.lowStock} itens</Badge>}
          />
          <CardBody className="space-y-3">
            {loading ? (
              <div className="grid gap-3">
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : lowStock.length ? (
              lowStock.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      SKU: {product.sku} • {formatCategoryLabel(product.category)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={product.stock <= 2 ? "danger" : "warn"}>Estoque: {product.stock}</Badge>
                    <p className="mt-1 text-[11px] text-slate-500">{productStatusLabel(product.status)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4 text-sm text-slate-700">
                Sem alertas de estoque.
              </div>
            )}

            <Button variant="secondary" className="w-full" onClick={() => (window.location.href = "/inventory")}>
              Ver estoque completo
            </Button>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Pedidos recentes"
          subtitle="Busca por código, cliente ou e-mail"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setQ("")}>Limpar</Button>
              <Button variant="primary" size="sm" onClick={() => window.location.assign("/reports")}>Exportar</Button>
            </div>
          }
        />
        <CardBody className="space-y-4">
          <Input aria-label="Buscar pedido" placeholder="Buscar pedido..." value={q} onChange={(event) => setQ(event.target.value)} />

          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-table text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr className="border-b border-slate-200/70">
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Itens</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Canal</th>
                    <th className="px-4 py-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-violet-50/35">
                      <td data-label="Pedido" className="px-4 py-3 font-semibold text-slate-900">#{order.code}</td>
                      <td data-label="Cliente" className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{order.customerName}</p>
                        <p className="text-xs text-slate-500">{order.email}</p>
                      </td>
                      <td data-label="Itens" className="px-4 py-3 text-slate-700">{order.itemsCount}</td>
                      <td data-label="Total" className="px-4 py-3 text-slate-700">{formatBRL(order.total)}</td>
                      <td data-label="Status" className="px-4 py-3">
                        <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
                      </td>
                      <td data-label="Canal" className="px-4 py-3 text-slate-700">{order.channel}</td>
                      <td data-label="Data" className="px-4 py-3 text-slate-500">{formatDateShort(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-slate-500">Mostrando {Math.min(orders.length, 8)} pedidos recentes.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Produtos em destaque"
          subtitle="Visão rápida do catálogo"
          right={<Badge tone="neutral">Atualizado</Badge>}
        />
        <CardBody>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((product) => (
                <div key={product.id} className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="truncate text-xs text-slate-500">{product.shortDescription}</p>
                    </div>
                    <Badge tone={productStatusTone(product.status)}>{productStatusLabel(product.status)}</Badge>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Preço</p>
                      <p className="text-sm font-semibold text-slate-900">{formatBRL(product.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Estoque</p>
                      <p className="text-sm font-semibold text-slate-900">{product.stock}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
