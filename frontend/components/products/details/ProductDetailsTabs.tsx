"use client";

import Image from "next/image";
import { ChevronDown, Play, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductListItem, ProductReview } from "@/lib/productsData";

function Stars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1" aria-label={`Avaliação ${full} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < full ? "h-4 w-4 fill-[#d1a35a] text-[#d1a35a]" : "h-4 w-4 text-zinc-300"}
          strokeWidth={1.6}
        />
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: ProductReview }) {
  return (
    <article className="border-b border-zinc-200 py-8 last:border-b-0">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-black/10">
            <Image src={review.avatar} alt={review.name} fill className="object-cover" sizes="48px" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">
              {review.name}
              {review.verified && (
                <span className="ml-2 text-xs font-medium text-zinc-500">(Compra verificada)</span>
              )}
            </p>
            <h4 className="text-sm font-semibold text-zinc-900">{review.title}</h4>
          </div>
        </div>

        <p className="text-xs text-zinc-500">{review.timeAgo}</p>
      </div>

      <div className="mt-3 max-w-3xl">
        <p className="text-sm leading-relaxed text-zinc-600">{review.text}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Stars value={review.rating} />
        <span className="text-sm font-semibold text-zinc-900">{review.rating.toFixed(1)}</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-[420px]">
        {review.media.slice(0, 3).map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className="relative overflow-hidden rounded-md bg-zinc-100 ring-1 ring-black/10"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={src}
                alt={`Mídia da avaliação ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 140px, 33vw"
              />
              {idx === 0 && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-zinc-900 ring-1 ring-black/10">
                    <Play className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function ProductDetailsTabs({ product }: { product: ProductListItem }) {
  const [tab, setTab] = useState<"description" | "additional" | "review">("review");

  const distribution = useMemo(
    () => [
      { stars: 5, pct: 72 },
      { stars: 4, pct: 18 },
      { stars: 3, pct: 7 },
      { stars: 2, pct: 2 },
      { stars: 1, pct: 1 },
    ],
    [],
  );

  const totalResults = 24;
  const showing = { from: 1, to: Math.min(4, totalResults) };
  const list = product.reviews.slice(0, 4);

  return (
    <section className="bg-white pb-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="border-t border-zinc-200 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-10 text-sm font-semibold text-zinc-500">
            <button
              type="button"
              onClick={() => setTab("description")}
              className={
                "relative py-2 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
                (tab === "description" ? "text-zinc-900" : "")
              }
            >
              Descrição
              {tab === "description" && (
                <span className="absolute left-0 right-0 top-full mx-auto mt-2 h-[2px] w-10 bg-zinc-900" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("additional")}
              className={
                "relative py-2 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
                (tab === "additional" ? "text-zinc-900" : "")
              }
            >
              Informações adicionais
              {tab === "additional" && (
                <span className="absolute left-0 right-0 top-full mx-auto mt-2 h-[2px] w-10 bg-zinc-900" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("review")}
              className={
                "relative py-2 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
                (tab === "review" ? "text-zinc-900" : "")
              }
            >
              Avaliações
              {tab === "review" && (
                <span className="absolute left-0 right-0 top-full mx-auto mt-2 h-[2px] w-10 bg-zinc-900" />
              )}
            </button>
          </div>

          <div className="mt-10">
            {tab === "description" && (
              <div className="max-w-4xl text-sm leading-relaxed text-zinc-600">{product.longDescription}</div>
            )}

            {tab === "additional" && (
              <div className="max-w-4xl overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="grid divide-y divide-zinc-200 text-sm text-zinc-700">
                  {[
                    ["Material", "Tecido tecnológico premium"],
                    ["Modelagem", "Fit anatômico"],
                    ["Cuidados", "Lavar com água fria"],
                    ["Origem", "Importado"],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-2 gap-4 px-4 py-3">
                      <p className="font-medium text-zinc-900">{k}</p>
                      <p className="text-zinc-600">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "review" && (
              <div className="space-y-10">
                <div className="grid gap-8 rounded-xl border border-zinc-200 bg-white p-6 sm:grid-cols-[280px_1fr]">
                  <div className="flex items-center justify-center gap-6 sm:justify-start">
                    <div className="text-center sm:text-left">
                      <p className="text-4xl font-semibold text-zinc-900">{product.rating.toFixed(1)}</p>
                      <p className="mt-1 text-xs text-zinc-500">de 5</p>
                      <div className="mt-2 flex justify-center sm:justify-start">
                        <Stars value={product.rating} />
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        ({Math.max(107, product.reviewCount)} avaliações)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {distribution.map((row) => (
                      <div key={row.stars} className="flex items-center gap-3">
                        <p className="w-10 text-xs font-medium text-zinc-600">{row.stars} estrelas</p>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-[#d1a35a]" style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">Lista de avaliações</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Exibindo {showing.from}-{showing.to} de {totalResults} resultados
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span>Ordenar por</span>
                      <label className="relative">
                        <select className="h-9 appearance-none rounded-md border border-zinc-200 bg-white pl-3 pr-9 text-xs font-semibold text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">
                          <option>Mais recentes</option>
                          <option>Mais antigas</option>
                          <option>Maior avaliação</option>
                          <option>Menor avaliação</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    {list.map((r) => (
                      <ReviewRow key={r.id} review={r} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
