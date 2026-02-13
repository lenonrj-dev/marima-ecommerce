"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input } from "../../components/dashboard/ui";
import { apiFetch, HttpError } from "../../lib/api";

export default function LoginClient({ reason }: { reason?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@exemplo.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showExpired = reason === "session-expired";

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        await apiFetch("/api/v1/auth/me");
        if (active) {
          router.replace("/");
        }
      } catch {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await apiFetch("/api/v1/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      router.replace("/");
      router.refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível entrar.");
      } else {
        setError("Não foi possível entrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_20%_10%,rgba(34,211,238,0.12),transparent_60%),radial-gradient(800px_500px_at_80%_0%,rgba(59,130,246,0.14),transparent_55%)]" />
        <div className="relative w-full max-w-md">
          <Card>
            <CardHeader title="Validando sessão" subtitle="Aguarde..." />
            <CardBody>
              <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_20%_10%,rgba(34,211,238,0.12),transparent_60%),radial-gradient(800px_500px_at_80%_0%,rgba(59,130,246,0.14),transparent_55%)]" />
      <div className="relative w-full max-w-md">
        <Card>
          <CardHeader title="Acesso ao Admin" subtitle="Entre para gerenciar sua operação." />
          <CardBody className="space-y-3">
            {showExpired ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Sua sessão expirou. Faça login novamente para continuar.
              </p>
            ) : null}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input
                label="E-mail"
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Senha"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
              ) : null}

              <div className="flex items-center justify-between gap-2 pt-2">
                <a
                  href="#"
                  className="text-xs text-cyan-200 underline decoration-white/20 underline-offset-4 hover:text-cyan-100"
                >
                  Esqueci minha senha
                </a>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
