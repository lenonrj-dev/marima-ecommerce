import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Facebook, Twitter, Youtube, Linkedin } from "lucide-react";
import Container from "@/components/ui/Container";
import { ABOUT_COPY, ABOUT_IMAGES } from "@/lib/aboutData";

export default function AboutHero() {
  return (
    <section className="bg-[#f7f2ea]">
      <Container className="py-10 sm:py-14 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left */}
          <div className="space-y-6">
            <h1 className="whitespace-pre-line font-serif text-4xl leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl">
              {ABOUT_COPY.hero.title}
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              {ABOUT_COPY.hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                {ABOUT_COPY.hero.primaryCta}
              </Link>

              <button
                type="button"
                className="group inline-flex h-11 items-center justify-center gap-3 rounded-md bg-transparent px-2 text-sm font-semibold text-zinc-900 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                aria-label="Explorar novidades"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-zinc-900 ring-1 ring-black/10 transition group-hover:shadow-sm">
                  <Play className="h-4 w-4" />
                </span>
                {ABOUT_COPY.hero.secondaryCta}
              </button>
            </div>

            <div className="flex items-center gap-4 pt-2 text-zinc-500">
              <Link
                href="#"
                aria-label="Facebook"
                className="transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                aria-label="Twitter"
                className="transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                aria-label="Youtube"
                className="transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Youtube className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                aria-label="LinkedIn"
                className="transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
              <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
                <Image
                  src={ABOUT_IMAGES.heroMain}
                  alt="Banner principal Marima"
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 44vw, 100vw"
                />
              </div>

              {/* Badge */}
              <div className="absolute left-6 top-6 grid h-20 w-20 place-items-center rounded-full bg-[#cbb79d] text-center text-[10px] font-semibold leading-tight text-white shadow-sm">
                {ABOUT_COPY.hero.badge}
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-10 left-6 w-[72%] max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-black/5">

                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-xs font-semibold text-zinc-500">01</p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Anterior"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#e37a33] text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      aria-label="Próximo"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#e37a33] text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer to account for floating card */}
            <div className="h-12" aria-hidden />
          </div>
        </div>
      </Container>
    </section>
  );
}
