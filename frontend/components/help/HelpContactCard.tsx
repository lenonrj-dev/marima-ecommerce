import Link from "next/link";
import { PhoneCall, FileDown } from "lucide-react";
import { HELP_CONTACT_CARD } from "@/lib/helpData";

export default function HelpContactCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{HELP_CONTACT_CARD.title}</p>
          <p className="mt-1 text-sm text-zinc-600">{HELP_CONTACT_CARD.subtitle}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white" aria-hidden>
          <PhoneCall className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Telefone</p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">{HELP_CONTACT_CARD.phone}</p>
        <p className="mt-1 text-xs text-zinc-500">{HELP_CONTACT_CARD.hint}</p>
      </div>

      <div className="mt-4 grid gap-2">
        <Link
          href={HELP_CONTACT_CARD.primaryHref}
          className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {HELP_CONTACT_CARD.primaryCta}
        </Link>

        <Link
          href={HELP_CONTACT_CARD.secondaryHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <FileDown className="h-4 w-4" />
          {HELP_CONTACT_CARD.secondaryCta}
        </Link>
      </div>
    </div>
  );
}
