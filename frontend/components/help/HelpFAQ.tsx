import { Plus } from "lucide-react";
import { HELP_FAQ } from "@/lib/helpData";

export default function HelpFAQ() {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{HELP_FAQ.title}</h2>
        <p className="text-xs text-zinc-500">Dúvidas comuns.</p>
      </div>

      <div className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
        {HELP_FAQ.items.map((it, idx) => (
          <details key={idx} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50">
              {it.q}
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition group-open:bg-zinc-900 group-open:text-white">
                <Plus className="h-4 w-4 transition group-open:rotate-45" />
              </span>
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-zinc-600">{it.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
