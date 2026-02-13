import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import { ABOUT_COPY, ABOUT_IMAGES } from "@/lib/aboutData";

export default function WhoWeAre() {
  return (
    <section className="bg-white py-14 sm:py-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900">
                {ABOUT_COPY.who.eyebrow}
              </p>
              <p className="max-w-md text-sm leading-relaxed text-zinc-600">
                {ABOUT_COPY.who.description}
              </p>
            </div>

            <div className="space-y-3">
              {ABOUT_COPY.who.bullets.map((text, idx) => (
                <div
                  key={text}
                  className="flex items-center gap-4 rounded-xl bg-[#f7f2ea] px-4 py-3 ring-1 ring-black/5"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e37a33] text-sm font-semibold text-white">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <span className="hidden text-sm font-semibold text-zinc-500 sm:inline">
                &nbsp;
              </span>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                {ABOUT_COPY.who.readMore}
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e37a33] text-white">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>

            <h2 className="mt-6 text-center font-serif text-4xl leading-tight text-zinc-900 sm:text-5xl">
              {ABOUT_COPY.who.heading}
            </h2>

            <div className="mt-8 overflow-hidden rounded-3xl bg-zinc-100 shadow-soft ring-1 ring-black/5">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={ABOUT_IMAGES.whoMain}
                  alt="Sobre a Marima"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 52vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
