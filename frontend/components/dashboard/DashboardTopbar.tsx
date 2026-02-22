"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

type DashboardTopbarProps = {
  user?: {
    name?: string;
  } | null;
};

export default function DashboardTopbar({ user }: DashboardTopbarProps) {
  return (
    <div className="sticky top-[72px] z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Minha conta</p>
            <p className="truncate text-base font-semibold text-zinc-900">{user?.name || "Cliente Marima"}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:inline-flex"
            >
              Voltar à loja
            </Link>

            <Link
              href="/dashboard/dados-pessoais"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              aria-label="Configurações"
            >
              <Settings className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
