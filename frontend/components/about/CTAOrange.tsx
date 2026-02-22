import Image from "next/image";

import Link from "next/link";

import Container from "@/components/ui/Container";

import { ABOUT_COPY, ABOUT_IMAGES } from "@/lib/aboutData";

export default function CTAOrange() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#e56b2c] via-[#ef8a3a] to-[#f5b357] py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-[0.15]">
        <div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white blur-3xl"
          aria-hidden
        />

        <div
          className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white blur-3xl"
          aria-hidden
        />
      </div>

      <Container>
        <div className="grid items-center gap-6 lg:grid-cols-[220px_1fr_220px]">
          <div className="relative mx-auto hidden h-[140px] w-[140px] overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/25 lg:block">
            <Image
              src="https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771282324/suporte2_lysfpk.png"
              alt="Imagem de apoio Marima à esquerda"
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
              {ABOUT_COPY.cta.kicker}
            </p>

            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {ABOUT_COPY.cta.title}
            </h3>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
              {ABOUT_COPY.cta.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/central-de-ajuda"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {ABOUT_COPY.cta.primary}
              </Link>
              <Link
                href="/produtos"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {ABOUT_COPY.cta.secondary}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[140px] w-[140px] overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/25 lg:block">
            <Image
              src="https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771282259/suporte_vnzc2j.png"
              alt="Imagem de apoio Marima à direita"
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
