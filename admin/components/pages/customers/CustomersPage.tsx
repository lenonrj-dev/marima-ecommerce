"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import CustomersTable from "./CustomersTable";
import CustomerDetailsModal from "./CustomerDetailsModal";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import type { Customer } from "../../../lib/types";

const SEGMENTS = [
  { value: "all", label: "Todos" },
  { value: "vip", label: "VIP" },
  { value: "recorrente", label: "Recorrentes" },
  { value: "novo", label: "Novos" },
  { value: "inativo", label: "Inativos" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("all");
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<ApiListResponse<Customer>>("/api/v1/admin/customers", {
          query: {
            q: q.trim() || undefined,
            segment: segment !== "all" ? segment : undefined,
            limit: 300,
          },
        });

        if (!active) return;
        setCustomers(response.data || []);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar clientes.");
        } else {
          setError("Não foi possível carregar clientes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      active = false;
    };
  }, [q, segment]);

  const stats = useMemo(() => {
    const vip = customers.filter((customer) => customer.segment === "vip").length;
    const recurring = customers.filter((customer) => customer.segment === "recorrente").length;
    const inactive = customers.filter((customer) => customer.segment === "inativo").length;
    return { total: customers.length, vip, recurring, inactive };
  }, [customers]);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">CRM de clientes, segmentação e ações de retenção.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setQ("")}>Limpar busca</Button>
          <Button variant="primary" onClick={() => window.location.assign("/reports")}>Exportar clientes</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Total" subtitle="Clientes" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="VIP" subtitle="Alto valor" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.vip}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recorrentes" subtitle="Recompra" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.recurring}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Inativos" subtitle="Reativar" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.inactive}</p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Base de clientes"
          subtitle="Clique em um cliente para ver detalhes."
          right={
            <div className="hidden items-center gap-2 sm:flex">
              <Badge tone={segment !== "all" ? "info" : "neutral"}>
                {segment !== "all" ? SEGMENTS.find((option) => option.value === segment)?.label : "Todos"}
              </Badge>
              <Badge tone="neutral">Backend</Badge>
            </div>
          }
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_260px]">
            <Input
              aria-label="Buscar cliente"
              placeholder="Buscar cliente, e-mail ou tag..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <Select
              aria-label="Filtrar por segmento"
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              options={SEGMENTS}
            />
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : (
            <CustomersTable customers={customers} onOpen={(customer) => setSelected(customer)} />
          )}

          <p className="text-xs text-slate-500">Mostrando {customers.length} clientes.</p>
        </CardBody>
      </Card>

      <CustomerDetailsModal open={!!selected} onClose={() => setSelected(null)} customer={selected} />
    </div>
  );
}
