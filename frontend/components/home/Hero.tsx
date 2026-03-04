"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Container from "@/components/ui/Container";

const HERO_SLIDES = [
  "https://res.cloudinary.com/dyuhostmv/image/upload/v1772656062/Instinct_Marima_roktwt.png",
  "https://res.cloudinary.com/dyuhostmv/image/upload/v1772656063/Banner_Marima_instinct_1_zgflnt.png",
  "https://res.cloudinary.com/dyuhostmv/image/upload/v1772656063/Instinct_Lil%C3%A1s_wtrlwx.png",
] as const;

const AUTO_MS = 4500;

export default function Hero() {
  const [active, setActive] = useState(0);
  const total = HERO_SLIDES.length;

  useEffect(() => {
    if (total <= 1) return;

    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [total]);

  const currentIndex = useMemo(() => {
    if (active < 0) return 0;
    if (active >= total) return total - 1;
    return active;
  }, [active, total]);

  return (
    <section className="bg-white">
      <Container>
        <div className="relative overflow-hidden rounded-2xl shadow-soft">
          <Link href="/produtos" aria-label="Ir para produtos da Marima" className="group block">
            <div className="relative w-full overflow-hidden bg-zinc-100 rounded-2xl">
              <div
                className="relative w-full"
                style={{
                  minHeight: "340px",
                  height: "clamp(340px, 46vw, 610px)",
                }}
              >
                {HERO_SLIDES.map((src, index) => {
                  const isActive = index === currentIndex;

                  return (
                    <div
                      key={src}
                      aria-hidden={!isActive}
                      className={[
                        "absolute inset-0 transition-opacity duration-700 ease-out",
                        isActive ? "opacity-100" : "pointer-events-none opacity-0",
                      ].join(" ")}
                    >
                      <Image
                        src={src}
                        alt={`Banner Instinct Marima ${index + 1}`}
                        fill
                        priority={index === 0}
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
                        sizes="(min-width: 1280px) 1300px, (min-width: 1024px) calc(100vw - 64px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
                      />
                    </div>
                  );
                })}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
              </div>

              {total > 1 ? (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/80 px-3 py-2 backdrop-blur">
                  {HERO_SLIDES.map((_, index) => {
                    const selected = index === currentIndex;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActive(index);
                        }}
                        aria-label={`Ir para slide ${index + 1}`}
                        aria-pressed={selected}
                        className={[
                          "h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                          selected ? "w-6 bg-zinc-900" : "w-2.5 bg-zinc-400 hover:bg-zinc-600",
                        ].join(" ")}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Link>
        </div>
      </Container>
    </section>
  );
}
