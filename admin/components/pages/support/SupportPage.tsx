"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import { formatDateShort } from "../../../lib/format";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import type { SupportTicket } from "../../../lib/types";

const STATUS = [
  { value: "all", label: "Todos" },
  { value: "aberto", label: "Abertos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "resolvido", label: "Resolvidos" },
];

function statusLabel(status: SupportTicket["status"]) {
  if (status === "aberto") return "Aberto";
  if (status === "em_andamento") return "Em andamento";
  return "Resolvido";
}

function statusTone(status: SupportTicket["status"]) {
  if (status === "aberto") return "warn" as const;
  if (status === "em_andamento") return "info" as const;
  return "success" as const;
}

function nextStatus(status: SupportTicket["status"]): SupportTicket["status"] {
  if (status === "aberto") return "em_andamento";
  if (status === "em_andamento") return "resolvido";
  return "resolvido";
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<ApiListResponse<SupportTicket>>("/api/v1/admin/tickets", {
          query: {
            q: q.trim() || undefined,
            status: status !== "all" ? status : undefined,
            limit: 300,
          },
        });

        if (!active) return;
        setTickets(response.data || []);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar tickets.");
        } else {
          setError("Não foi possível carregar tickets.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, [q, status]);

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === "aberto").length;
    const doing = tickets.filter((ticket) => ticket.status === "em_andamento").length;
    const done = tickets.filter((ticket) => ticket.status === "resolvido").length;
    return { total: tickets.length, open, doing, done };
  }, [tickets]);

  async function advance(ticket: SupportTicket) {
    const targetStatus = nextStatus(ticket.status);

    if (ticket.status === targetStatus) return;

    setUpdatingId(ticket.id);
    setError(null);

    try {
      const response = await apiFetch<{ data: SupportTicket }>(`/api/v1/admin/tickets/${ticket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: targetStatus }),
      });

      setTickets((previous) => previous.map((item) => (item.id === ticket.id ? response.data : item)));
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível atualizar o ticket.");
      } else {
        setError("Não foi possível atualizar o ticket.");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Suporte</h1>
          <p className="mt-1 text-sm text-slate-500">Atendimento, trocas e pós-venda com visão de CRM.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setQ("")}>Limpar busca</Button>
          <Button variant="primary" onClick={() => window.location.assign("/settings")}>Configurar SLA</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Total" subtitle="Tickets" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Abertos" subtitle="Aguardando" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.open}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Em andamento" subtitle="Tratando" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.doing}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Resolvidos" subtitle="Concluídos" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.done}</p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Fila de atendimento"
          subtitle="Busque e filtre tickets por status"
          right={<Badge tone="neutral">Backend</Badge>}
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_260px]">
            <Input
              aria-label="Buscar ticket"
              placeholder="Buscar ticket, assunto ou cliente..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <Select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)} options={STATUS} />
          </div>

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
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Assunto</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="transition-colors hover:bg-violet-50/35">
                      <td data-label="Ticket" className="px-4 py-3 font-semibold text-slate-900">{ticket.code}</td>
                      <td data-label="Assunto" className="px-4 py-3 text-slate-700">{ticket.subject}</td>
                      <td data-label="Cliente" className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{ticket.customerName}</p>
                        <p className="text-xs text-slate-500">{ticket.email}</p>
                      </td>
                      <td data-label="Status" className="px-4 py-3">
                        <Badge tone={statusTone(ticket.status)}>{statusLabel(ticket.status)}</Badge>
                      </td>
                      <td data-label="Prioridade" className="px-4 py-3">
                        <Badge tone={ticket.priority === "alta" ? "danger" : ticket.priority === "media" ? "warn" : "neutral"}>
                          {ticket.priority === "alta" ? "Alta" : ticket.priority === "media" ? "Média" : "Baixa"}
                        </Badge>
                      </td>
                      <td data-label="Data" className="px-4 py-3 text-slate-500">{formatDateShort(ticket.createdAt)}</td>
                      <td data-label="Ações" className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => advance(ticket)}
                          disabled={updatingId === ticket.id || ticket.status === "resolvido"}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          {updatingId === ticket.id ? "Atualizando..." : ticket.status === "resolvido" ? "Concluído" : "Avançar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
