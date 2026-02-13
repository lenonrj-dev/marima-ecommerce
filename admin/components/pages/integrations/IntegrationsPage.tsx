"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Divider, Toggle } from "../../dashboard/ui";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import type { Integration, IntegrationKey } from "../../../lib/types";

const GROUP_LABEL: Record<IntegrationKey, string> = {
  pagamentos: "Pagamentos",
  frete: "Frete",
  email: "E-mail",
  whatsapp: "WhatsApp",
  analytics: "Análises",
  pixel: "Pixel",
};

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<ApiListResponse<Integration>>("/api/v1/admin/integrations", { query: { limit: 100 } });
      setItems(response.data || []);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível carregar integrações.");
      } else {
        setError("Não foi possível carregar integrações.");
      }
    } finally {
      setLoading(false);
    }
  }

  const groups = useMemo(() => {
    const map = new Map<IntegrationKey, Integration[]>();
    items.forEach((integration) => {
      const groupList = map.get(integration.group) || [];
      groupList.push(integration);
      map.set(integration.group, groupList);
    });
    return Array.from(map.entries());
  }, [items]);

  async function toggle(id: string, connected: boolean) {
    setPendingId(id);
    setError(null);

    try {
      const response = await apiFetch<{ data: Integration }>(`/api/v1/admin/integrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ connected }),
      });

      setItems((previous) => previous.map((integration) => (integration.id === id ? response.data : integration)));
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível atualizar integração.");
      } else {
        setError("Não foi possível atualizar integração.");
      }
    } finally {
      setPendingId(null);
    }
  }

  async function testWebhook(id: string) {
    setPendingId(id);
    setError(null);

    try {
      await apiFetch(`/api/v1/admin/integrations/${id}/test-webhook`, {
        method: "POST",
      });
      window.alert("Webhook testado com sucesso.");
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Falha ao testar webhook.");
      } else {
        setError("Falha ao testar webhook.");
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Integrações</h1>
          <p className="mt-1 text-sm text-slate-500">Conectores e webhooks com persistência real.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => loadItems()}>Atualizar</Button>
          <Button variant="primary" onClick={() => window.location.assign("/settings")}>Abrir configurações</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <Card>
        <CardHeader title="Conexões" subtitle="Ative e configure integrações." right={<Badge tone="neutral">Backend</Badge>} />
        <CardBody className="space-y-6">
          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : (
            groups.map(([group, list]) => (
              <section key={group} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{GROUP_LABEL[group]}</p>
                    <p className="text-xs text-slate-500">Configure credenciais e endpoints reais.</p>
                  </div>
                  <Badge tone="neutral">
                    {list.filter((integration) => integration.connected).length}/{list.length}
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((integration) => (
                    <div key={integration.id} className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{integration.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{integration.description}</p>
                        </div>
                        <Toggle
                          checked={integration.connected}
                          onChange={(checked) => toggle(integration.id, checked)}
                          label="Conectado"
                          className="w-auto"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={pendingId === integration.id}
                          onClick={() => testWebhook(integration.id)}
                        >
                          Testar webhook
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.assign("/settings")}
                        >
                          Configurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Divider />
              </section>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
