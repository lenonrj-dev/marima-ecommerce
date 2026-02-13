import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import { ABOUT_COPY, ABOUT_IMAGES } from "@/lib/aboutData";

function DealCountdownItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[54px] rounded-xl bg-white/90 px-3 py-2 text-center ring-1 ring-black/10">
      <p className="text-base font-semibold text-zinc-900">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function CountdownPill() {
  const c = ABOUT_COPY.deal.countdown;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DealCountdownItem value={c.days} label="Dias" />
      <DealCountdownItem value={c.hours} label="Horas" />
      <DealCountdownItem value={c.mins} label="Min" />
      <DealCountdownItem value={c.secs} label="Seg" />
    </div>
  );
}

function SmallDealCard({
  image,
  eyebrow,
  title,
}: {
  image: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
      <div className="relative aspect-[16/10] w-full bg-zinc-100">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 28vw, 100vw"
        />
      </div>
      <div className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {eyebrow}
        </p>
        <p className="text-lg font-semibold leading-snug text-zinc-900">
          {title}
        </p>
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#e37a33] hover:opacity-90"
        >
          Comprar agora <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function DealOfWeek() {
  return (
    <section className="bg-white py-14 sm:py-16">
      <Container className="space-y-10">
        <div className="text-center">
          <h2 className="font-serif text-4xl leading-tight text-zinc-900 sm:text-5xl">
            {ABOUT_COPY.deal.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            {ABOUT_COPY.deal.description}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-100 shadow-soft ring-1 ring-black/5">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={ABOUT_IMAGES.dealLeft}
                alt="Oferta da semana"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 54vw, 100vw"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                Oferta especial
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                Condições por tempo limitado
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <CountdownPill />

                <Link
                  href="/produtos"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Ver coleção
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <SmallDealCard
              image={ABOUT_IMAGES.dealRight}
              eyebrow="Novidades"
              title="Escolhas da semana"
            />
            <SmallDealCard
              image={ABOUT_IMAGES.dealRight}
              eyebrow="Essenciais"
              title="Looks para todos os dias"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}



