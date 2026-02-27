import Image from "next/image";

import Link from "next/link";

import {
  Facebook,
  Instagram,
} from "lucide-react";

import Container from "@/components/ui/Container";

import { ABOUT_COPY } from "@/lib/aboutData";

export default function AboutHero() {
  return (
    <section className="bg-[#f7f2ea]">
      <Container className="py-10 sm:py-14 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <h1 className="whitespace-pre-line font-serif text-4xl leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl">
              {ABOUT_COPY.hero.title}
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              {ABOUT_COPY.hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/produtos"
                className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                {ABOUT_COPY.hero.primaryCta}
              </Link>

            </div>

            <div className="flex items-center gap-4 pt-2 text-zinc-500">
              <Link
                href="https://www.facebook.com/profile.php?id=61579379169198&ref=NONE_xav_ig_profile_page_web#"
                aria-label="Facebook"
                className="transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Facebook className="h-4 w-4" />
              </Link>

              <Link
                href="https://www.instagram.com/use.marima.ofc/"
                aria-label="Instagram"
                className="transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <Instagram className="h-4 w-4" />
              </Link>

            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
              <div className="relative aspect-[4/3] w-full sm:aspect-[5/4]">
                <Image
                  src="https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771271924/heroabout_aszixy.png"
                  alt="Banner principal Marima"
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 44vw, 100vw"
                />
              </div>

              <div className="absolute left-6 top-6 grid h-20 w-20 place-items-center rounded-full bg-[#cbb79d] text-center text-[10px] font-semibold leading-tight text-white shadow-sm">
                {ABOUT_COPY.hero.badge}
              </div>

            </div>

          </div>
        </div>
      </Container>
    </section>
  );
}
