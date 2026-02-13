import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Recuperar senha da conta Marima com acesso seguro aos seus pedidos",
  description: "Recupere o acesso da sua conta Marima.",
};

export default function RecoverPasswordPage() {
  return (
    <main className="min-h-[60vh] bg-white py-12 sm:py-16">
      <section className="mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Recuperar senha</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Para redefinir sua senha, envie um e-mail para suporte.marima.loja@gmail.com.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="mailto:suporte.marima.loja@gmail.com"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Falar com suporte
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Voltar para entrar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


