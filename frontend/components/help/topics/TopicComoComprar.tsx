import Link from "next/link";
import { HOW_TO_BUY } from "@/lib/institutionalData";

export default function TopicComoComprar() {
  return (
    <article className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{HOW_TO_BUY.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Passo a passo para uma compra segura e transparente na Marima.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Etapas da compra</h3>
        <ol className="mt-3 space-y-2 text-sm text-zinc-600">
          {HOW_TO_BUY.steps.map((step, idx) => (
            <li key={step}>
              {idx + 1}. {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Link
          href="/produtos"
          className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {HOW_TO_BUY.ctas.primary}
        </Link>
        <Link
          href="mailto:suporte.marima.loja@gmail.com"
          className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {HOW_TO_BUY.ctas.secondary}
        </Link>
      </section>
    </article>
  );
}


