"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductListItem } from "@/lib/productsData";

export default function ProductGallery({
  product,
}: {
  product: ProductListItem;
}) {
  const images = useMemo(
    () =>
      (product.gallery?.length ? product.gallery : [{ src: product.image, alt: product.title }]).slice(
        0,
        4,
      ),
    [product.gallery, product.image, product.title],
  );

  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0]!;

  const prev = () => setActive((v) => (v - 1 + images.length) % images.length);
  const next = () => setActive((v) => (v + 1) % images.length);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-black/10">
        <div className="relative aspect-[4/6] w-full min-h-[360px] sm:min-h-[420px]">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 58vw, 100vw"
          />
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="Imagem anterior"
          className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-md bg-[#d1a35a] text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Próxima imagem"
          className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white text-zinc-900 shadow-sm ring-1 ring-black/10 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {images.map((img, idx) => {
          const selected = idx === active;
          return (
            <button
              key={`${img.src}-${idx}`}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Selecionar imagem ${idx + 1}`}
              className={
                "relative overflow-hidden rounded-md bg-white ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 " +
                (selected ? "ring-[#d1a35a]" : "ring-black/10 hover:ring-black/20")
              }
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 12vw, 25vw"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
