import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { formatIDR, type ProductListItem } from "@/lib/productsData";

export default function ProductCardPLP({ item }: { item: ProductListItem }) {
  return (
    <article className="group">
      <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-3xl bg-zinc-100">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>

        <div className="px-5 pb-5 pt-4">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
            {item.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600">{item.description}</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white">
              {formatIDR(item.price)}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Adicionar aos favoritos"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Adicionar ao carrinho"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
