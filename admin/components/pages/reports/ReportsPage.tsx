"use client";

import { Badge, Button, Card, CardBody, CardHeader, Divider } from "../../dashboard/ui";
import { MiniBars } from "../../dashboard/MiniCharts";
import { buildApiUrl } from "../../../lib/api";

function download(path: string) {
  window.open(buildApiUrl(path), "_blank", "noopener,noreferrer");
}

export default function ReportsPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Relatórios</h1>
          <p className="mt-1 text-sm text-slate-500">Exportações e visão gerencial para a operação de e-commerce.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.location.assign("/analytics")}>Ver análises</Button>
          <Button variant="primary" onClick={() => download("/api/v1/admin/reports/sales/export?format=csv")}>Exportar geral</Button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Vendas" subtitle="Pedidos, itens e receita" right={<Badge tone="neutral">CSV</Badge>} />
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-700">Relatório de pedidos com itens, cupons e status.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => download("/api/v1/admin/reports/sales/export?format=csv")}>Exportar CSV</Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.assign("/sales")}>Abrir vendas</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Produtos" subtitle="Catálogo e estoque" right={<Badge tone="neutral">CSV</Badge>} />
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-700">SKU, categoria, preço, estoque e status.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => download("/api/v1/admin/reports/products/export?format=csv")}>Exportar CSV</Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.assign("/products")}>Abrir produtos</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Clientes" subtitle="CRM e segmentação" right={<Badge tone="neutral">CSV</Badge>} />
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-700">Lista, LTV, recorrência e tags.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => download("/api/v1/admin/reports/customers/export?format=csv")}>Exportar CSV</Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.assign("/customers")}>Abrir clientes</Button>
            </div>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader title="Painel gerencial" subtitle="Visão rápida" right={<Badge tone="neutral">Backend</Badge>} />
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
              <p className="text-xs text-slate-500">Meta mensal (exemplo)</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Receita • progresso</p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7D48D3] to-[#A17CFF]" style={{ width: "68%" }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">68% atingido.</p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
              <p className="text-xs text-slate-500">Sazonalidade (exemplo)</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Oscilação semanal</p>
              <MiniBars values={[12, 18, 15, 25, 22, 30, 26, 20, 19, 28, 34, 31]} />
              <p className="mt-1 text-xs text-slate-500">Integre com vendas reais por dia no backend.</p>
            </div>
          </div>

          <Divider />

          <div className="grid gap-4 md:grid-cols-3">
            <Hint title="DRE simplificado">Margem, custos (ads/frete), impostos e lucro para gestão completa.</Hint>
            <Hint title="Análise de coorte">Entenda recompra por mês de aquisição, segmentando VIP e recorrentes.</Hint>
            <Hint title="Produtos campeões">Receita por SKU, taxa de devolução, giro de estoque e margem.</Hint>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Hint({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-700">{children}</p>
    </div>
  );
}
