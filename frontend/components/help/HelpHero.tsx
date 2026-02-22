import Link from "next/link";
import Container from "@/components/ui/Container";
import { HELP_HERO } from "@/lib/helpData";

export default function HelpHero({ current }: { current?: { label: string; title?: string } }) {
  return (
    <section className="relative overflow-hidden bg-zinc-900">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771333506/Bnner_qsnwfa.png)` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/30" aria-hidden />

      <Container>
        <div className="relative py-10 sm:py-12 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
            {current?.label ?? "Ajuda"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {current?.title ?? HELP_HERO.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/80">
            {HELP_HERO.breadcrumb.map((b, idx) => (
              <span key={b.label} className="inline-flex items-center gap-2">
                <Link href={b.href} className="hover:text-white">
                  {b.label}
                </Link>
                {idx < HELP_HERO.breadcrumb.length - 1 ? <span className="opacity-60">/</span> : null}
              </span>
            ))}
            {current?.label ? (
              <>
                <span className="opacity-60">/</span>
                <span className="text-white">{current.label}</span>
              </>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
