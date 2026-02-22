import Link from "next/link";
import { HELP_TOPICS, type HelpTopicSlug } from "@/lib/helpData";

export default function HelpSidebar({ active }: { active: HelpTopicSlug }) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-soft">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Tópicos</p>

        <nav className="grid">
          {HELP_TOPICS.map((t) => {
            const Icon = t.icon;
            const isActive = t.slug === active;
            return (
              <Link
                key={t.slug}
                href={`/central-de-ajuda/${t.slug}`}
                className={[
                  "group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition",
                  isActive ? "bg-zinc-900 text-white" : "bg-white text-zinc-800 hover:bg-zinc-50",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-3">
                  <span
                    className={[
                      "grid h-9 w-9 place-items-center rounded-xl border transition",
                      isActive
                        ? "border-white/15 bg-white/10"
                        : "border-zinc-200 bg-white group-hover:bg-zinc-50",
                    ].join(" ")}
                    aria-hidden
                  >
                    <Icon className={isActive ? "h-4 w-4 text-white" : "h-4 w-4 text-zinc-700"} />
                  </span>
                  <span>{t.label}</span>
                </span>

                <span
                  className={[
                    "grid h-8 w-8 place-items-center rounded-full border text-xs transition",
                    isActive
                      ? "border-white/15 bg-white/10 text-white"
                      : "border-zinc-200 bg-white text-zinc-500 group-hover:bg-zinc-50",
                  ].join(" ")}
                  aria-hidden
                >
                  →
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-zinc-900">Atendimento</p>
        <p className="mt-1 text-sm text-zinc-600">
          Se preferir, fale com nosso suporte e resolvemos com você.
        </p>
        <Link
          href="https://wa.me/5524981467489?text=Ola!%20Vim%20pelo%20site%20da%20Marima%20e%20quero%20saber%20das%20promocoes."
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Falar com suporte
        </Link>
        <p className="mt-2 text-xs text-zinc-500">Tempo médio de resposta: até 24h úteis.</p>
      </div>
    </aside>
  );
}

