"use client";

import { FormEvent, useEffect, useState } from "react";
import Panel from "@/components/dashboard/cards/Panel";
import { apiFetch, HttpError } from "@/lib/api";

type MeProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

export default function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await apiFetch<{ data: MeProfile }>("/api/v1/me/profile");
        if (!active) return;

        setName(response.data.name || "");
        setPhone(response.data.phone || "");
        setEmail(response.data.email || "");
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar seu perfil.");
        } else {
          setError("Não foi possível carregar seu perfil.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch<{ data: MeProfile }>("/api/v1/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined }),
      });

      setName(response.data.name || "");
      setPhone(response.data.phone || "");
      setEmail(response.data.email || "");
      setMessage("Dados atualizados com sucesso.");
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível atualizar seu perfil.");
      } else {
        setError("Não foi possível atualizar seu perfil.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <div className="border-b border-zinc-200 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Dados pessoais</p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">Meu perfil</h2>
        <p className="mt-2 text-sm text-zinc-600">Atualize suas informações pessoais e mantenha seu cadastro em dia.</p>
      </div>

      <form className="grid gap-5 p-5 sm:p-6" onSubmit={handleSubmit}>
        {loading ? (
          <p className="text-sm text-zinc-600">Carregando dados...</p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {message ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-900">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              placeholder="Seu nome"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-900">Telefone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              placeholder="(00) 00000-0000"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-zinc-900">E-mail</span>
          <input
            type="email"
            value={email}
            readOnly
            className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700 outline-none"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-900">Nova senha</span>
            <input
              type="password"
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              placeholder="••••••••"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-900">Confirmar senha</span>
            <input
              type="password"
              className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              placeholder="••••••••"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-zinc-500">Ao salvar, você confirma que as informações estão corretas.</p>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
