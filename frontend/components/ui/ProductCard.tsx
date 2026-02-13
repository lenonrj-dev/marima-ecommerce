"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/productsData";
import { formatMoneyBRL } from "@/lib/productsData";
import { useCart, useFavorites } from "@/components/cart/CartProvider";

export type ProductCardProps = {
  product: Product;
  href?: string;
};

export default function ProductCard({ product, href }: ProductCardProps) {
  const { addProduct } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const linkHref = href ?? `/produtos/${product.slug}`;
  const favorite = isFavorite(product.id);
  const colorVariants = Array.isArray(product.colorVariants)
    ? Array.from(new Map(product.colorVariants.map((item) => [item.slug, item] as const)).values()).filter(
        (item) => item.slug && item.colorName,
      )
    : [];

  return (
    <article className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
      <div className="relative">
        {product.badge && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2 py-1 text-[11px] font-semibold text-white">
            {product.badge}
          </span>
        )}

        <Link href={linkHref} className="block" aria-label={`Ver detalhes de ${product.title}`}>
          <div className="relative aspect-[4/5] w-full bg-zinc-100">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 90vw"
            />
          </div>
        </Link>

        <button
          type="button"
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={() => toggleFavorite(product)}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 ring-1 ring-black/10 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <Heart className={favorite ? "h-4 w-4 fill-current text-rose-500" : "h-4 w-4"} />
        </button>
      </div>

      <div className="space-y-2 p-4">
        <Link
          href={linkHref}
          className="line-clamp-2 text-sm font-semibold text-zinc-900 transition hover:underline"
        >
          {product.title}
        </Link>

        <p className="line-clamp-2 text-xs text-zinc-600">{product.description}</p>

        {colorVariants.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {colorVariants.slice(0, 6).map((item) => {
              const activeVariant = item.slug === product.slug;
              const disabled = !item.isAvailable;
              const hex = item.colorHex || "#e4e4e7";
              const baseClass = [
                "inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25",
                disabled ? "cursor-not-allowed opacity-45" : "",
                activeVariant ? "ring-black/30" : "ring-black/10 hover:ring-black/20",
              ].join(" ");

              const swatch = (
                <span
                  className={["h-4.5 w-4.5 rounded-full", activeVariant ? "ring-2 ring-white" : ""].join(" ")}
                  style={{ backgroundColor: hex }}
                />
              );

              if (disabled || activeVariant) {
                return (
                  <span
                    key={item.slug}
                    className={baseClass}
                    aria-label={`${item.colorName}${disabled ? " (Indisponível)" : ""}`}
                    title={disabled ? "Indisponível" : item.colorName}
                  >
                    {swatch}
                  </span>
                );
              }

              return (
                <Link
                  key={item.slug}
                  href={`/produtos/${item.slug}`}
                  className={baseClass}
                  aria-label={`Ver ${product.title} na cor ${item.colorName}`}
                >
                  {swatch}
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-zinc-900">{formatMoneyBRL(product.price)}</span>
            {typeof product.compareAtPrice === "number" && (
              <span className="text-xs text-zinc-400 line-through">
                {formatMoneyBRL(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-600">
            <Star className="h-3.5 w-3.5 fill-[#d1a35a] text-[#d1a35a]" />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => addProduct(product, { qty: 1 })}
            disabled={product.stock <= 0}
            className={[
              "inline-flex h-9 w-full items-center justify-center gap-2 rounded-md text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
              product.stock <= 0
                ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
            ].join(" ")}
            aria-label={`Adicionar ${product.title} ao carrinho`}
          >
            <ShoppingBag className="h-4 w-4" />
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </article>
  );
}

