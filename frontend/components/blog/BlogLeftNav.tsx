import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BlogLeftNav({
  topics,
  activeTopic,
}: {
  topics: Array<{ id: string; label: string }>;
  activeTopic: string;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[96px] space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">Navegação</p>
            <span className="text-[11px] font-semibold text-zinc-500">Blog</span>
          </div>

          <div className="mt-4 space-y-1">
            <Link
              href="/blog"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Início do blog
            </Link>
            <Link
              href="/produtos"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Ver coleção
            </Link>
            <Link
              href="/sobre"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Sobre a Marima
            </Link>
          </div>

          <div className="mt-5 border-t border-zinc-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Tópicos</p>
            <div className="mt-2 space-y-1">
              {topics.map((t) => {
                const active = t.id === activeTopic;
                return (
                  <Link
                    key={t.id}
                    href="/blog"
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                      active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50",
                    )}
                  >
                    {t.label}
                    <span className={cn("text-[11px]", active ? "text-white/70" : "text-zinc-400")}>?</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-5 border-t border-zinc-200 pt-4">
            <Link
              href="/central-de-ajuda"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Central de ajuda
            </Link>
            <Link
              href="mailto:suporte.marima.loja@gmail.com"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Falar com suporte
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}


