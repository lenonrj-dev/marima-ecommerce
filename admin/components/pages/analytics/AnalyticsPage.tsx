"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import { MiniBars, MiniLine, PillsTabs } from "../../dashboard/MiniCharts";
import { formatCompactNumber, formatDateShort, formatPct } from "../../../lib/format";
import { apiFetch, HttpError } from "../../../lib/api";
import type { DeviceBreakdown, EmailCampaignRow } from "../../../lib/types";

const PERIODS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [tab, setTab] = useState<"emails" | "trafego">("emails");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seriesPoints, setSeriesPoints] = useState<Array<{ date: string; value: number }>>([]);
  const [deviceRows, setDeviceRows] = useState<DeviceBreakdown[]>([]);
  const [emailRows, setEmailRows] = useState<EmailCampaignRow[]>([]);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const [seriesRes, deviceRes, emailRes] = await Promise.all([
          apiFetch<{ data: Array<{ date: string; value: number }> }>("/api/v1/admin/analytics/revenue-series", {
            query: { days: period },
          }),
          apiFetch<{ data: DeviceBreakdown[] }>("/api/v1/admin/analytics/device"),
          apiFetch<{ data: EmailCampaignRow[] }>("/api/v1/admin/analytics/email-campaigns"),
        ]);

        if (!active) return;

        setSeriesPoints(seriesRes.data || []);
        setDeviceRows(deviceRes.data || []);
        setEmailRows(emailRes.data || []);
      } catch (err) {
        if (!active) return;

        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar análises.");
        } else {
          setError("Não foi possível carregar análises.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [period]);

  const series = useMemo(() => seriesPoints.map((point) => point.value), [seriesPoints]);
  const bars = useMemo(() => series.slice(-12).map((value) => Math.max(1, Math.round(value / 70))), [series]);

  const campaigns = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = [...emailRows].sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
    if (!term) return list;
    return list.filter((campaign) => campaign.name.toLowerCase().includes(term));
  }, [q, emailRows]);

  const emailSummary = useMemo(() => {
    const sent = campaigns.reduce((acc, campaign) => acc + campaign.sent, 0);
    const avgCtr = campaigns.length ? campaigns.reduce((acc, campaign) => acc + campaign.ctr, 0) / campaigns.length : 0;
    const avgDelivered = campaigns.length
      ? campaigns.reduce((acc, campaign) => acc + campaign.deliveredRate, 0) / campaigns.length
      : 0;

    return { sent, avgCtr, avgDelivered };
  }, [campaigns]);

  const deviceMax = Math.max(1, ...deviceRows.map((device) => device.opened), 1);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Análises</h1>
          <p className="mt-1 text-sm text-slate-500">Métricas transacionais de pedidos, clientes e receita.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Selecionar período"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            options={PERIODS}
          />
          <Button variant="secondary" onClick={() => setQ("")}>Limpar filtros</Button>
          <Button variant="primary" onClick={() => window.location.assign("/reports")}>Exportar</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader title="Performance" subtitle="Receita e tendência" right={<Badge tone="neutral">Backend</Badge>} />
          <CardBody className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
              <p className="text-xs text-slate-500">Tendência de receita</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Período selecionado</p>
              <MiniLine values={series.length ? series : [0, 0, 0, 0]} />
              <p className="mt-1 text-xs text-slate-500">Baseado em pedidos pagos no período.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
              <p className="text-xs text-slate-500">Atividade diária</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Últimos 12 pontos</p>
              <MiniBars values={bars.length ? bars : [1, 1, 1, 1]} />
              <p className="mt-1 text-xs text-slate-500">Evolução diária da receita.</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Por dispositivo" subtitle="Aberturas e cliques" />
          <CardBody className="space-y-3">
            {deviceRows.length ? (
              deviceRows.map((device) => (
                <div key={device.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{device.label}</span>
                    <span className="text-slate-500">{formatCompactNumber(device.opened)} aberturas</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7D48D3] to-[#A17CFF]"
                      style={{ width: `${Math.round((device.opened / deviceMax) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Cliques: {formatCompactNumber(device.clicks)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Sem dados de dispositivo no momento.
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Performance de marketing"
          subtitle="E-mails e funis"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <PillsTabs
                value={tab}
                onChange={setTab}
                options={[
                  { value: "emails", label: "E-mails" },
                  { value: "trafego", label: "Tráfego" },
                ]}
              />
              <Badge tone="neutral">{period} dias</Badge>
            </div>
          }
        />
        <CardBody className="space-y-4">
          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : tab === "emails" ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
                  <p className="text-xs text-slate-500">E-mails enviados</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCompactNumber(emailSummary.sent)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
                  <p className="text-xs text-slate-500">CTR médio</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPct(emailSummary.avgCtr)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
                  <p className="text-xs text-slate-500">Taxa de entrega</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPct(emailSummary.avgDelivered)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Input
                  aria-label="Buscar campanha"
                  placeholder="Buscar campanha..."
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setQ("")}>Limpar</Button>
                  <Button variant="primary" size="sm" onClick={() => window.location.assign("/reports")}>Exportar</Button>
                </div>
              </div>

              <EmailTable rows={campaigns} />
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader title="Funil" subtitle="Visita → Carrinho → Compra" />
                <CardBody>
                  <p className="text-sm text-slate-700">Estrutura pronta para eventos reais.</p>
                  <div className="mt-4 space-y-2">
                    <FunnelRow label="Visitas" value={100} />
                    <FunnelRow label="Carrinho" value={36} />
                    <FunnelRow label="Checkout" value={18} />
                    <FunnelRow label="Compra" value={8} />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Fontes" subtitle="Orgânico / Pago / E-mail" />
                <CardBody className="space-y-2">
                  <SourceRow label="Orgânico" value={42} />
                  <SourceRow label="Pago" value={35} />
                  <SourceRow label="E-mail" value={13} />
                  <SourceRow label="Social" value={10} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Recomendações" subtitle="Ações rápidas" />
                <CardBody>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    <li>Automatize carrinho abandonado (D0/D1/D3).</li>
                    <li>Crie oferta para estoque baixo e giro lento.</li>
                    <li>Ative cashback por categoria para aumentar LTV.</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function FunnelRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500">{value}%</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70">
        <div className="h-full rounded-full bg-gradient-to-r from-[#7D48D3] to-[#A17CFF]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SourceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-3">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <span className="text-sm text-slate-700">{value}%</span>
    </div>
  );
}

function EmailTable({ rows }: { rows: EmailCampaignRow[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
        Nenhuma campanha encontrada para o filtro informado.
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr className="border-b border-slate-200/70">
            <th scope="col" className="px-4 py-3">Campanha</th>
            <th scope="col" className="px-4 py-3">Data de envio</th>
            <th scope="col" className="px-4 py-3">Enviados</th>
            <th scope="col" className="px-4 py-3">Taxa de cliques (CTR)</th>
            <th scope="col" className="px-4 py-3">Taxa de entrega</th>
            <th scope="col" className="px-4 py-3">Taxa de descadastro</th>
            <th scope="col" className="px-4 py-3">Taxa de spam</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-violet-50/35">
              <td data-label="Campanha" className="px-4 py-3">
                <p className="font-semibold text-slate-900">{row.name}</p>
              </td>
              <td data-label="Data de envio" className="px-4 py-3 text-slate-700">{formatDateShort(row.publishDate)}</td>
              <td data-label="Enviados" className="px-4 py-3 text-slate-700">{row.sent}</td>
              <td data-label="Taxa de cliques (CTR)" className="px-4 py-3 text-slate-700">{formatPct(row.ctr)}</td>
              <td data-label="Taxa de entrega" className="px-4 py-3 text-slate-700">{formatPct(row.deliveredRate)}</td>
              <td data-label="Taxa de descadastro" className="px-4 py-3 text-slate-700">{formatPct(row.unsubscribeRate)}</td>
              <td data-label="Taxa de spam" className="px-4 py-3 text-slate-700">{formatPct(row.spamRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
