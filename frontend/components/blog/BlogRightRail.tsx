import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { BlogPostItem } from "@/lib/blogData";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{title}</h3>
        <Link
          href="#"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <ExternalLink className="h-4 w-4" />
          Compartilhar
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function BlogRightRail({ related }: { related: BlogPostItem[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[96px] space-y-4">
        <Section title="Artigos relacionados">
          <div className="space-y-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <div className="relative h-14 w-16 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-black/5">
                  <Image src={p.cover} alt={p.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:underline">
                    {p.title}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">{p.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Ações rápidas">
          <div className="grid gap-2">
            <button
              type="button"
              className="inline-flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              aria-label="Copiar link do artigo"
              onClick={() => {
                if (typeof navigator !== "undefined" && "clipboard" in navigator) {
                  navigator.clipboard.writeText(window.location.href).catch(() => {});
                }
              }}
            >
              Copiar link
              <span className="text-zinc-400" aria-hidden>
                &rarr;
              </span>
            </button>

            <button
              type="button"
              className="inline-flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              aria-label="Compartilhar artigo"
              onClick={() => {
                if (typeof navigator !== "undefined" && "share" in navigator) {
                  navigator
                    .share({ title: document.title, url: window.location.href })
                    .catch(() => {});
                }
              }}
            >
              Compartilhar
              <span className="text-zinc-400" aria-hidden>
                &rarr;
              </span>
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Integração futura: rastrear cliques e engajamento em redes sociais.
          </p>
        </Section>
      </div>
    </aside>
  );
}
