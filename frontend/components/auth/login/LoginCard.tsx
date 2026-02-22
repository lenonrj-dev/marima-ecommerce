"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Facebook, KeyRound, Mail } from "lucide-react";
import { LOGIN_COPY } from "@/lib/loginData";
import { apiFetch, HttpError } from "@/lib/api";
import { sanitizeNextPath } from "@/lib/authSession";

export default function LoginCard({ reason, nextPath }: { reason?: string; nextPath?: string }) {
  const router = useRouter();
  const showExpired = reason === "session-expired";
  const safeNextPath = sanitizeNextPath(nextPath, "/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch("/api/v1/auth/customer/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      window.dispatchEvent(new Event("marima:auth-changed"));
      router.replace(safeNextPath);
      router.refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível entrar na sua conta.");
      } else {
        setError("Não foi possível entrar na sua conta.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] bg-white/35 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)] ring-1 ring-black/10 backdrop-blur-xl sm:p-7 md:min-h-[455px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-tight text-zinc-700">{LOGIN_COPY.brand}</p>
        <Link
          href="/registrar"
          className="text-xs font-semibold text-white/70 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {LOGIN_COPY.signup}
        </Link>
      </div>
      <div className="mt-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[28px]">{LOGIN_COPY.title}</h1>
        
      </div>
      {showExpired ? (
        <div className="mt-4 rounded-2xl bg-amber-50/80 px-4 py-3 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80">
          Sua sessão expirou. Faça login novamente para continuar.
        </div>
      ) : null}
      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              placeholder={LOGIN_COPY.passwordPlaceholder}
              className="h-full w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Link
              href="/recuperar-senha"
              className="inline-flex h-8 items-center justify-center rounded-full bg-white/70 px-3 text-[11px] font-semibold text-zinc-700 ring-1 ring-black/10 transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              {LOGIN_COPY.forgot}
            </Link>
          </div>
        </label>
        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
        <p className="pt-2 text-[10px] leading-relaxed text-zinc-600">{LOGIN_COPY.helper}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-zinc-600">{LOGIN_COPY.footerNote}</p>
          <button
            type="submit"
            disabled={loading}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Continuar"
          >
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
