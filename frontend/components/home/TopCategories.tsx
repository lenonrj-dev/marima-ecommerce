"use client";

import { useRef } from "react";

import Image from "next/image";
import Link from "next/link";

import Container from "@/components/ui/Container";

import SectionHeading from "@/components/ui/SectionHeading";

import IconButton from "@/components/ui/IconButton";

import { categories } from "@/lib/homeData";

import { ChevronLeft, ChevronRight } from "lucide-react";

function buildCategoryHref(title: string) {
  const normalized = title.trim().toLowerCase();
  const params = new URLSearchParams();

  switch (normalized) {
    case "leggings":
      params.set("search", "legging");
      break;
    case "tops":
      params.set("search", "top");
      break;
    case "novidades":
      params.set("sort", "newest");
      break;
    case "conjuntos":
      params.set("search", "conjunto");
      break;
    case "mais vendidos":
      params.set("sort", "rating_desc");
      break;
    default:
      params.set("search", title);
      break;
  }

  return `/produtos?${params.toString()}`;
}

export default function TopCategories() {
  const ref = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: "left" | "right") => {
    const el = ref.current;

    if (!el) return;

    el.scrollBy({ left: dir === "left" ? -420 : 420, behavior: "smooth" });
  };

  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeading
          title="Categorias em destaque"
          subtitle="Escolha as categorias mais buscadas e encontre seu próximo look fitness."
          right={
            <>
              <IconButton
                aria-label="Categorias anteriores"
                onClick={() => scrollBy("left")}
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </IconButton>
              <IconButton
                aria-label="Próximas categorias"
                onClick={() => scrollBy("right")}
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </IconButton>
            </>
          }
        />

        <div
          ref={ref}
          className="mt-8 flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildCategoryHref(c.title)}
              aria-label={`Ver produtos de ${c.title}`}
              className="relative mr-30 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
            >
              <div className="relative h-[120px] w-[120px] overflow-hidden rounded-full bg-zinc-100">
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  sizes="120px"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-black/35" />
              </div>

              <div className="absolute inset-0 grid place-items-center px-3 text-center">
                <div>
                  <p className="text-sm font-semibold text-white">{c.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
