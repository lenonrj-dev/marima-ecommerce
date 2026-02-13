"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Panel from "@/components/dashboard/cards/Panel";
import { apiFetch, HttpError } from "@/lib/api";
import type { DashboardAddress } from "@/lib/dashboardData";

const EMPTY_FORM: Omit<DashboardAddress, "id"> = {
  label: "",
  fullName: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  complement: "",
  isDefault: false,
};

export default function AddressBook({ compact }: { compact?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<DashboardAddress[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let active = true;

    async function loadAddresses() {
      try {
        const response = await apiFetch<{ data: DashboardAddress[] }>("/api/v1/me/addresses");
        if (!active) return;
        setItems(response.data || []);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar seus endereços.");
        } else {
          setError("Não foi possível carregar seus endereços.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAddresses();

    return () => {
      active = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    if (!compact) return items;
    const defaultAddress = items.find((address) => address.isDefault);
    return defaultAddress ? [defaultAddress] : items.slice(0, 1);
  }, [compact, items]);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function openForCreate() {
    setError(null);
    setSuccess(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openForEdit(address: DashboardAddress) {
    setError(null);
    setSuccess(null);
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip: address.zip,
      complement: address.complement || "",
      isDefault: Boolean(address.isDefault),
    });
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        label: form.label.trim(),
        fullName: form.fullName.trim(),
        zip: form.zip.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim(),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement?.trim() || undefined,
        isDefault: Boolean(form.isDefault),
      };

      if (editingId) {
        const response = await apiFetch<{ data: DashboardAddress }>(`/api/v1/me/addresses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        setItems((previous) =>
          previous.map((address) => (address.id === editingId ? response.data : address)),
        );
        setSuccess("Endereço atualizado com sucesso.");
      } else {
        const response = await apiFetch<{ data: DashboardAddress }>("/api/v1/me/addresses", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setItems((previous) => [response.data, ...previous]);
        setSuccess("Endereço adicionado com sucesso.");
      }

      resetForm();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível salvar o endereço.");
      } else {
        setError("Não foi possível salvar o endereço.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setSuccess(null);

    try {
      await apiFetch(`/api/v1/me/addresses/${id}`, { method: "DELETE" });
      setItems((previous) => previous.filter((address) => address.id !== id));
      setSuccess("Endereço removido com sucesso.");
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível remover o endereço.");
      } else {
        setError("Não foi possível remover o endereço.");
      }
    }
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Endereços</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">
            {compact ? "Endereço principal" : "Meus endereços"}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">Gerencie seus endereços de entrega com praticidade.</p>
        </div>

        {!compact ? (
          <button
            type="button"
            onClick={openForCreate}
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            Adicionar endereço
          </button>
        ) : null}
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {loading ? <p className="text-sm text-zinc-600">Carregando endereços...</p> : null}

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        ) : null}

        {!compact && formOpen ? (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Apelido</span>
                <input
                  value={form.label}
                  onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  placeholder="Casa, trabalho..."
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Nome completo</span>
                <input
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">CEP</span>
                <input
                  value={form.zip}
                  onChange={(event) => setForm((prev) => ({ ...prev, zip: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Estado</span>
                <input
                  value={form.state}
                  onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Cidade</span>
                <input
                  value={form.city}
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Bairro</span>
                <input
                  value={form.neighborhood}
                  onChange={(event) => setForm((prev) => ({ ...prev, neighborhood: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  required
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Rua</span>
                <input
                  value={form.street}
                  onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Número</span>
                <input
                  value={form.number}
                  onChange={(event) => setForm((prev) => ({ ...prev, number: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Complemento</span>
                <input
                  value={form.complement || ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, complement: event.target.value }))}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                />
              </label>
            </div>

            <label className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={Boolean(form.isDefault)}
                onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Definir como endereço padrão
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Salvando..." : editingId ? "Salvar endereço" : "Adicionar endereço"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {visibleItems.length === 0 && !loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-soft">
            {compact
              ? "Nenhum endereço cadastrado até o momento."
              : "Você ainda não possui endereços cadastrados."}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {visibleItems.map((address) => (
            <div key={address.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {address.label}{" "}
                    {address.isDefault ? (
                      <span className="ml-2 rounded-full bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white">
                        Padrão
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{address.fullName}</p>
                </div>

                {!compact ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openForEdit(address)}
                      className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      Remover
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 text-sm text-zinc-700">
                <p>
                  {address.street}, {address.number}
                </p>
                {address.complement ? <p>{address.complement}</p> : null}
                <p>
                  {address.neighborhood} - {address.city}/{address.state}
                </p>
                <p className="text-zinc-600">CEP: {address.zip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
