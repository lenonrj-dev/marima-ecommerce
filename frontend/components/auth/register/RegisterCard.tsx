"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, Mail, User2 } from "lucide-react";
import { LOGIN_COPY } from "@/lib/loginData";
import { apiFetch, HttpError } from "@/lib/api";

export default function RegisterCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch("/api/v1/auth/customer/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      window.dispatchEvent(new Event("marima:auth-changed"));
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível criar sua conta.");
      } else {
        setError("Não foi possível criar sua conta.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] bg-white/35 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)] ring-1 ring-black/10 backdrop-blur-xl sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-tight text-zinc-700">{LOGIN_COPY.brand}</p>

        <Link
          href="/login"
          className="text-xs font-semibold text-zinc-700 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Entrar
        </Link>
      </div>

      <div className="mt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[28px]">Criar conta</h1>
        <p className="mt-2 text-sm text-zinc-600">Crie sua conta para salvar favoritos e acompanhar pedidos.</p>
      </div>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Nome</span>
          <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/55 px-4 ring-1 ring-black/10 backdrop-blur-md">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/70 ring-1 ring-black/10">
              <User2 className="h-4 w-4 text-zinc-700" />
            </span>

            <input
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              className="h-full w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="sr-only">E-mail</span>
          <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/55 px-4 ring-1 ring-black/10 backdrop-blur-md">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/70 ring-1 ring-black/10">
              <Mail className="h-4 w-4 text-zinc-700" />
            </span>

            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder={LOGIN_COPY.emailPlaceholder}
              className="h-full w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="sr-only">Senha</span>
          <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/55 px-4 ring-1 ring-black/10 backdrop-blur-md">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/70 ring-1 ring-black/10">
              <KeyRound className="h-4 w-4 text-zinc-700" />
            </span>

            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={LOGIN_COPY.passwordPlaceholder}
              className="h-full w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </label>

        {error ? <p className="text-xs text-rose-700">{error}</p> : null}

        <p className="pt-2 text-[10px] leading-relaxed text-zinc-600">
          Ao criar sua conta, você concorda com nossos termos e política de privacidade.
        </p>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-zinc-600">Seus dados estão protegidos.</p>

          <button
            type="submit"
            disabled={loading}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Criar conta"
          >
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
