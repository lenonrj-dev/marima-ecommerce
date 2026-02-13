"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[68vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Erro inesperado</span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Não foi possível carregar esta página</h1>
        <p className="mt-2 text-sm text-slate-600">Ocorreu uma falha temporária. Tente novamente ou volte para o início do painel.</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-b from-[#8B5CF6] to-[#7D48D3] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(125,72,211,0.28)] transition hover:from-[#7D48D3] hover:to-[#6C39C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
