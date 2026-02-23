"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { LOGIN_COPY } from "@/lib/loginData";
import { apiFetch, HttpError } from "@/lib/api";
import { sanitizeNextPath } from "@/lib/authSession";
import { mergeGuestCartAfterAuth } from "@/lib/cartMerge";

const MARIMA_LOGO = "https://res.cloudinary.com/dwf2uc6ot/image/upload/v1771878588/M_iza4g7.png";

export default function LoginCard({ reason, nextPath }: { reason?: string; nextPath?: string }) {
  const router = useRouter();
  const showExpired = reason === "session-expired";
  const safeNextPath = sanitizeNextPath(nextPath, "/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

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

      await mergeGuestCartAfterAuth();
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
    <div
      className="w-full max-w-[420px] rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_28px_80px_rgba(24,24,27,0.14)] sm:p-8"
      style={{ marginLeft: 65 }}
      role="region"
      aria-label="Entrar na conta"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-tight text-zinc-700">{LOGIN_COPY.brand}</p>
        <Link
          href={`/registrar?next=${encodeURIComponent(safeNextPath)}`}
          className="text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {LOGIN_COPY.signup}
        </Link>
      </div>

      <div className="mt-6 grid place-items-center text-center">
        <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
          <Image
            src={MARIMA_LOGO}
            alt="Marima"
            width={48}
            height={48}
            className="h-8 w-8 object-contain"
            priority
          />
        </div>

        <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-zinc-900 sm:text-[26px]">{LOGIN_COPY.title}</h1>
        <p className="mt-1 max-w-[28ch] text-sm text-zinc-600">{LOGIN_COPY.helper}</p>
      </div>

      {showExpired ? (
        <div
          className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900"
          role="status"
          aria-live="polite"
        >
          Sua sessão expirou. Faça login novamente para continuar.
        </div>
      ) : null}

      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">E-mail</span>
          <div className="group flex h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 shadow-sm transition focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-black/10">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700">
              <Mail className="h-4 w-4" aria-hidden="true" />
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
              inputMode="email"
              aria-label="E-mail"
            />
          </div>
        </label>

        <label className="block">
          <span className="sr-only">Senha</span>
          <div className="group flex h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 shadow-sm transition focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-black/10">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
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
              aria-label="Senha"
            />
            <Link
              href="/recuperar-senha"
              className="inline-flex h-9 items-center justify-center rounded-full bg-white px-3 text-[11px] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              {LOGIN_COPY.forgot}
            </Link>
          </div>
        </label>

        {error ? (
          <p
            ref={errorRef}
            tabIndex={-1}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 outline-none"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Entrar"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-600">{LOGIN_COPY.footerNote}</p>
          <Link
            href="/"
            className="text-[11px] font-semibold text-zinc-600 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            Voltar para a loja
          </Link>
        </div>
      </form>
    </div>
  );
}
