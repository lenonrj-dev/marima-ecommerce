"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StatCard({
  title,
  value,
  hint,
  href,
  icon,
  tone = "zinc",
}: {
  title: string;
  value: string;
  hint: string;
  href: string;
  icon: React.ReactNode;
  tone?: "zinc" | "blue" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-blue-50 ring-blue-200 text-blue-900"
      : tone === "emerald"
        ? "bg-emerald-50 ring-emerald-200 text-emerald-900"
        : tone === "amber"
          ? "bg-amber-50 ring-amber-200 text-amber-900"
          : "bg-zinc-50 ring-zinc-200 text-zinc-900";

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
          <p className="mt-1 text-sm text-zinc-600">{hint}</p>
        </div>

        <div className={cn("grid h-12 w-12 place-items-center rounded-2xl ring-1", toneClass)}>
          {icon}
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
        Ver detalhes
        <span className="transition group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}
