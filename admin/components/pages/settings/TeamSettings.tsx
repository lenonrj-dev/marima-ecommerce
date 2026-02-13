"use client";

import { useMemo, useState, useEffect } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";

type Role = "admin" | "operacao" | "marketing" | "suporte";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "operacao", label: "Operação" },
  { value: "marketing", label: "Marketing" },
  { value: "suporte", label: "Suporte" },
];

function randomPassword() {
  return `Tmp${Math.random().toString(36).slice(2, 8)}!`;
}

export default function TeamSettings() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      setLoading(true);
      setMessage(null);

      try {
        const response = await apiFetch<ApiListResponse<Member>>("/api/v1/admin/users", {
          query: { limit: 300 },
        });

        if (!active) return;
        setMembers(response.data || []);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setMessage(err.message || "Não foi possível carregar membros da equipe.");
        } else {
          setMessage("Não foi possível carregar membros da equipe.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members.filter((member) => {
      const hitText = !term || member.name.toLowerCase().includes(term) || member.email.toLowerCase().includes(term);
      const hitRole = role === "all" ? true : member.role === role;
      return hitText && hitRole;
    });
  }, [members, q, role]);

  async function toggleActive(member: Member) {
    setSavingId(member.id);
    setMessage(null);

    try {
      const response = await apiFetch<{ data: Member }>(`/api/v1/admin/users/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !member.active }),
      });

      setMembers((previous) => previous.map((item) => (item.id === member.id ? response.data : item)));
    } catch (err) {
      if (err instanceof HttpError) {
        setMessage(err.message || "Não foi possível atualizar membro.");
      } else {
        setMessage("Não foi possível atualizar membro.");
      }
    } finally {
      setSavingId(null);
    }
  }

  async function inviteMember() {
    const name = window.prompt("Nome do novo membro");
    if (!name) return;

    const email = window.prompt("E-mail do novo membro");
    if (!email) return;

    const roleInput = (window.prompt("Função: admin | operacao | marketing | suporte", "operacao") || "operacao") as Role;
    const temporaryPassword = randomPassword();

    setMessage(null);

    try {
      const response = await apiFetch<{ data: Member }>("/api/v1/admin/users/invite", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          role: roleInput,
          temporaryPassword,
        }),
      });

      setMembers((previous) => [response.data, ...previous]);
      setMessage(`Convite criado para ${email}. Senha temporária: ${temporaryPassword}`);
    } catch (err) {
      if (err instanceof HttpError) {
        setMessage(err.message || "Não foi possível convidar membro.");
      } else {
        setMessage("Não foi possível convidar membro.");
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title="Equipe"
        subtitle="Acesso por função (RBAC)"
        right={<Button variant="primary" size="sm" onClick={inviteMember}>Convidar</Button>}
      />
      <CardBody className="space-y-4">
        {message ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[1.2fr_240px]">
          <Input aria-label="Buscar membro" placeholder="Buscar membro..." value={q} onChange={(event) => setQ(event.target.value)} />
          <Select
            aria-label="Filtrar por função"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            options={[{ value: "all", label: "Todas" }, ...ROLES]}
          />
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
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filtered.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-violet-50/35">
                    <td data-label="Membro" className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </td>
                    <td data-label="Função" className="px-4 py-3 text-slate-700">
                      {ROLES.find((option) => option.value === member.role)?.label}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <Badge tone={member.active ? "success" : "neutral"}>{member.active ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td data-label="Ações" className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(member)}
                        disabled={savingId === member.id}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {savingId === member.id ? "Salvando..." : member.active ? "Desativar" : "Ativar"}
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
  );
}
