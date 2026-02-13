"use client";

import Image from "next/image";
import Link from "next/link";
import Panel from "@/components/dashboard/cards/Panel";
import { useFavorites } from "@/components/cart/CartProvider";
import { formatMoneyBRL } from "@/lib/dashboardData";

export default function FavoritesGrid({ compact }: { compact?: boolean }) {
  const { isHydrated, items, removeFavorite } = useFavorites();
  const visibleItems = compact ? items.slice(0, 4) : items;

  return (
    <Panel>
      <div className="flex items-end justify-between gap-4 border-b border-zinc-200 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Favoritos</p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">
            {compact ? "Favoritos recentes" : "Meus favoritos"}
          </h2>
        </div>

        {compact ? (
          <Link href="/dashboard/favoritos" className="text-sm font-semibold text-zinc-900 underline underline-offset-4">
            Ver tudo
          </Link>
        ) : null}
      </div>

      {!isHydrated ? (
        <p className="p-5 text-sm text-zinc-600 sm:p-6">Carregando favoritos...</p>
      ) : null}

      {isHydrated && visibleItems.length === 0 ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-soft">
            Nenhum produto salvo nos favoritos até o momento.
          </div>
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {visibleItems.map((item) => {
            const href = item.slug ? `/produtos/${item.slug}` : "/produtos";
            const priceCents = Math.round((item.price || 0) * 100);

            return (
              <article
                key={item.productId}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:bg-zinc-50"
              >
                <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">
                  <div className="relative aspect-[4/3] w-full bg-zinc-100">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 22vw, 100vw"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">
                    <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  </Link>
                  <p className="mt-1 text-sm text-zinc-600">{formatMoneyBRL(priceCents)}</p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Link href={href} className="text-sm font-semibold text-zinc-900">
                      Ver produto
                    </Link>
                    {!compact ? (
                      <button
                        type="button"
                        onClick={() => removeFavorite(item.productId)}
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </Panel>
  );
}
