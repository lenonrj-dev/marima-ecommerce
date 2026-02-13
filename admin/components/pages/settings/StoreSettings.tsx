"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Input, Select, Textarea } from "../../dashboard/ui";
import { apiFetch, HttpError } from "../../../lib/api";

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { value: "UTC", label: "UTC" },
];

const CURRENCIES = [
  { value: "BRL", label: "BRL (R$)" },
  { value: "USD", label: "USD ($)" },
];

type StoreSettingsResponse = {
  id: string;
  name: string;
  domain: string;
  timezone: string;
  currency: string;
  supportEmail: string;
  policy: string;
};

export default function StoreSettings() {
  const [name, setName] = useState("Minha Loja");
  const [domain, setDomain] = useState("minhaloja.com");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [currency, setCurrency] = useState("BRL");
  const [supportEmail, setSupportEmail] = useState("suporte@minhaloja.com");
  const [policy, setPolicy] = useState("Trocas em até 7 dias. Consulte regras no site.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setMessage(null);

      try {
        const response = await apiFetch<{ data: StoreSettingsResponse }>("/api/v1/admin/settings/store");

        if (!active) return;

        setName(response.data.name || "");
        setDomain(response.data.domain || "");
        setTimezone(response.data.timezone || "America/Sao_Paulo");
        setCurrency(response.data.currency || "BRL");
        setSupportEmail(response.data.supportEmail || "");
        setPolicy(response.data.policy || "");
      } catch (err) {
        if (!active) return;

        if (err instanceof HttpError) {
          setMessage(err.message || "Não foi possível carregar configurações da loja.");
        } else {
          setMessage("Não foi possível carregar configurações da loja.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      await apiFetch("/api/v1/admin/settings/store", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          domain,
          timezone,
          currency,
          supportEmail,
          policy,
        }),
      });

      setMessage("Configurações da loja salvas com sucesso.");
    } catch (err) {
      if (err instanceof HttpError) {
        setMessage(err.message || "Não foi possível salvar configurações.");
      } else {
        setMessage("Não foi possível salvar configurações.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Loja" subtitle="Informações gerais e políticas" />
      <CardBody className="space-y-4">
        {message ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Input aria-label="Nome da loja" placeholder="Nome da loja" value={name} onChange={(event) => setName(event.target.value)} />
          <Input aria-label="Domínio" placeholder="Domínio" value={domain} onChange={(event) => setDomain(event.target.value)} />
          <Select aria-label="Fuso horário" value={timezone} onChange={(event) => setTimezone(event.target.value)} options={TIMEZONES} />
          <Select aria-label="Moeda" value={currency} onChange={(event) => setCurrency(event.target.value)} options={CURRENCIES} />
          <Input
            aria-label="E-mail de suporte"
            placeholder="E-mail de suporte"
            value={supportEmail}
            onChange={(event) => setSupportEmail(event.target.value)}
            className="md:col-span-2"
          />
        </div>

        <Textarea
          aria-label="Política de trocas"
          placeholder="Política de trocas"
          value={policy}
          onChange={(event) => setPolicy(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.location.assign("/")} disabled={loading || saving}>Pré-visualizar</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {loading ? <p className="text-xs text-slate-500">Carregando configurações...</p> : null}
      </CardBody>
    </Card>
  );
}
