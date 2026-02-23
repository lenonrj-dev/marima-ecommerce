"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { KeyRound, Mail, User2 } from "lucide-react";
import { LOGIN_COPY } from "@/lib/loginData";
import { apiFetch, HttpError } from "@/lib/api";
import { sanitizeNextPath } from "@/lib/authSession";
import { mergeGuestCartAfterAuth } from "@/lib/cartMerge";

const MARIMA_LOGO = "https://res.cloudinary.com/dwf2uc6ot/image/upload/v1771878588/M_iza4g7.png";

export default function RegisterCard({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const safeNextPath = sanitizeNextPath(nextPath, "/dashboard");
  const [name, setName] = useState("");
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
      await apiFetch("/api/v1/auth/customer/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
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
        setError(err.message || "Não foi possível criar sua conta.");
      } else {
        setError("Não foi possível criar sua conta.");
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
      aria-label="Criar conta"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-tight text-zinc-700">{LOGIN_COPY.brand}</p>
        <Link
          href={`/login?next=${encodeURIComponent(safeNextPath)}`}
          className="text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Entrar
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

        <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-zinc-900 sm:text-[26px]">Criar conta</h1>
        <p className="mt-1 max-w-[32ch] text-sm text-zinc-600">Crie sua conta para salvar favoritos e acompanhar pedidos.</p>
      </div>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Nome</span>
          <div className="group flex h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 shadow-sm transition focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-black/10">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700">
              <User2 className="h-4 w-4" aria-hidden="true" />
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
              aria-label="Nome"
            />
          </div>
        </label>

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
              autoComplete="new-password"
              placeholder={LOGIN_COPY.passwordPlaceholder}
              className="h-full w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              aria-label="Senha"
            />
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

        <p className="pt-2 text-[11px] leading-relaxed text-zinc-600">
          Ao criar sua conta, você concorda com nossos termos e política de privacidade.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="Criar conta"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-600">Seus dados estão protegidos.</p>
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
