"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCart, useFavorites } from "@/components/cart/CartProvider";
import { formatMoneyBRL } from "@/lib/productsData";

export default function FavoritesContent() {
  const { addItem } = useCart();
  const { isHydrated, items, removeFavorite, clearFavorites } = useFavorites();

  if (!isHydrated) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-soft">
        Carregando seus favoritos...
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-soft">
        <p className="text-lg font-semibold text-zinc-900">Seus favoritos estão vazios</p>
        <p className="mt-2 text-sm text-zinc-600">Salve produtos para comparar e comprar depois.</p>
        <Link
          href="/produtos"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          Explorar novidades
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600">{items.length} produto(s) favoritado(s)</p>
        <button
          type="button"
          onClick={clearFavorites}
          className="text-sm font-semibold text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
        >
          Limpar favoritos
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const href = `/produtos/${item.slug}`;

          return (
            <article
              key={item.productId}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft"
            >
              <Link href={href} className="block">
                <div className="relative aspect-[4/5] w-full bg-zinc-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 90vw"
                  />
                </div>
              </Link>

              <div className="space-y-3 p-4">
                <Link href={href} className="line-clamp-2 text-sm font-semibold text-zinc-900 hover:underline">
                  {item.title}
                </Link>

                <p className="text-sm font-semibold text-zinc-900">{formatMoneyBRL(item.price)}</p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeFavorite(item.productId)}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    aria-label={`Remover ${item.title} dos favoritos`}
                  >
                    <Heart className="mr-2 h-4 w-4 fill-current text-rose-500" />
                    Remover
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addItem({
                        productId: item.productId,
                        slug: item.slug,
                        name: item.title,
                        imageUrl: item.image,
                        unitPrice: Math.round((item.price || 0) * 100),
                        qty: 1,
                      });
                    }}
                    className={[
                      "inline-flex h-10 flex-1 items-center justify-center rounded-md px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                      "bg-zinc-900 text-white hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

