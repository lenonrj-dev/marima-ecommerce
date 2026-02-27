"use client";

import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductColorVariant, ProductColorVariantsResponse, ProductListItem } from "@/lib/productsData";
import { formatCategoryLabel, formatMoneyBRL } from "@/lib/productsData";
import { SITE_COPY } from "@/lib/siteCopy";
import { useCart, useFavorites } from "@/components/cart/CartProvider";

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

export default function ProductInfoPanel({
  product,
  variants,
}: {
  product: ProductListItem;
  variants?: ProductColorVariantsResponse | null;
}) {
  const router = useRouter();
  const { addProduct, startCheckout } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(product.id);

  const sizeType = product.sizeType ?? (product.sizesDetailed?.length ? "custom" : "unico");
  const sizesDetailed = useMemo(
    () => (Array.isArray(product.sizesDetailed) ? product.sizesDetailed : []),
    [product.sizesDetailed],
  );
  const hasSizeStock = sizeType !== "unico" && sizesDetailed.length > 0;

  const initialSize = useMemo(() => {
    if (!hasSizeStock) return "";
    return sizesDetailed.find((row) => row.stock > 0)?.label ?? sizesDetailed[0]?.label ?? "";
  }, [hasSizeStock, sizesDetailed]);

  const [size, setSize] = useState(() => initialSize);
  const [qty, setQty] = useState(1);

  const selectedSize = useMemo(() => {
    if (!hasSizeStock) return "";
    if (size && sizesDetailed.some((entry) => entry.label === size)) return size;
    return initialSize;
  }, [hasSizeStock, initialSize, size, sizesDetailed]);

  const colorGroup = variants?.groupKey ? variants : null;
  const currentColorName = (colorGroup?.current?.colorName || product.colorName || "").trim();

  const colorVariants = useMemo(() => {
    if (!colorGroup?.variants?.length) return [];
    const unique = Array.from(new Map(colorGroup.variants.map((item) => [item.slug, item] as const)).values());
    return unique.filter((item) => item.slug && item.colorName);
  }, [colorGroup]);

  const selectedSizeStock = useMemo(() => {
    if (!hasSizeStock) return Math.max(0, Math.floor(Number(product.stock ?? 0)));
    const row = sizesDetailed.find((entry) => entry.label === selectedSize);
    return Math.max(0, Math.floor(Number(row?.stock ?? 0)));
  }, [hasSizeStock, product.stock, selectedSize, sizesDetailed]);

  const outOfStock = product.stock <= 0 || (hasSizeStock && selectedSizeStock <= 0);
  const maxQty = useMemo(
    () => Math.max(1, hasSizeStock ? selectedSizeStock : product.stock),
    [hasSizeStock, product.stock, selectedSizeStock],
  );
  const tags = product.tags?.length ? product.tags.join(", ") : "moda fitness";

  const variantLabel = useMemo(() => {
    const parts: string[] = [];
    if (currentColorName) parts.push(currentColorName);
    if (hasSizeStock && selectedSize) parts.push(selectedSize);
    return parts.join(" - ");
  }, [currentColorName, hasSizeStock, selectedSize]);

  const qtySafe = Math.max(1, Math.min(qty, maxQty));

  function addToCart() {
    addProduct(product, { qty: qtySafe, variant: variantLabel || undefined, sizeLabel: hasSizeStock ? selectedSize : undefined });
  }

  function buyNow() {
    addProduct(product, { qty: qtySafe, variant: variantLabel || undefined, sizeLabel: hasSizeStock ? selectedSize : undefined });
    startCheckout();
  }

  function selectColor(next: ProductColorVariant) {
    if (next.slug === product.slug) return;
    if (!next.isAvailable) return;
    router.push(`/produtos/${next.slug}`);
  }

  return (
    <div className="w-full">
      <p className="text-sm text-zinc-500">{formatCategoryLabel(product.category)}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[28px]">
        {product.title}
      </h2>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
        <Stars value={product.rating} />
        <span className="text-zinc-400">|</span>
        <span>
          {product.rating.toFixed(1)} ({product.reviewCount} avaliações)
        </span>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <p className="text-xl font-semibold text-zinc-900">{formatMoneyBRL(product.price)}</p>
        {typeof product.compareAtPrice === "number" && (
          <p className="text-sm text-zinc-400 line-through">{formatMoneyBRL(product.compareAtPrice)}</p>
        )}
      </div>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600">{product.longDescription}</p>

      <div className="mt-6 space-y-5">
        {colorGroup && colorVariants.length > 1 ? (
          <div className="space-y-2">
            <p className="text-sm text-zinc-700">
              <span className="font-medium">Cor</span>: {currentColorName || "Selecione"}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {colorVariants.map((item) => {
                const active = item.slug === product.slug;
                const disabled = !item.isAvailable;
                const hex = item.colorHex || "#e4e4e7";
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => selectColor(item)}
                    disabled={disabled}
                    aria-disabled={disabled ? "true" : undefined}
                    aria-label={`Selecionar cor ${item.colorName}`}
                    title={disabled ? "Indisponível" : undefined}
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25",
                      disabled ? "cursor-not-allowed opacity-45" : "",
                      active ? "ring-black/30" : "ring-black/10 hover:ring-black/20",
                    ].join(" ")}
                  >
                    <span
                      className={["h-5 w-5 rounded-full", active ? "ring-2 ring-white" : ""].join(" ")}
                      style={{ backgroundColor: hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {hasSizeStock ? (
          <div className="space-y-2">
            <p className="text-sm text-zinc-700">
              <span className="font-medium">Tamanho</span>: {selectedSize || "Selecione"}
            </p>
            <div className="grid grid-cols-6 gap-2">
              {sizesDetailed.map((row) => {
                const active = row.label === selectedSize;
                const disabled = row.stock <= 0;
                return (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() => setSize(row.label)}
                    disabled={disabled}
                    aria-disabled={disabled ? "true" : undefined}
                    className={[
                      "h-9 rounded-md border text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                      disabled
                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                        : active
                          ? "border-[#d1a35a] bg-[#d1a35a] text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                    ].join(" ")}
                    title={disabled ? "Indisponível" : undefined}
                  >
                    {row.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-700">
              <span className="font-medium">Tamanho</span>: Único
            </p>
          </div>
        )}

        <div className="flex items-center text-sm">
          <span
            className={[
              "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1",
              outOfStock
                ? "bg-red-50 text-red-700 ring-red-100"
                : "bg-emerald-50 text-emerald-700 ring-emerald-100",
            ].join(" ")}
          >
            {outOfStock ? "Sem estoque" : "Em estoque"}
          </span>
        </div>

        <div className="flex items-stretch gap-3">
          <div className="inline-flex h-11 items-center overflow-hidden rounded-md border border-zinc-200 bg-white">
            <button
              type="button"
              onClick={() => setQty((value) => Math.max(1, value - 1))}
              className="inline-flex h-full w-11 items-center justify-center text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="grid h-full w-12 place-items-center text-sm font-semibold text-zinc-900">{qtySafe}</div>
            <button
              type="button"
              onClick={() => setQty((value) => Math.min(maxQty, Math.max(1, value) + 1))}
              className="inline-flex h-full w-11 items-center justify-center text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={outOfStock}
            className={[
              "h-11 flex-1 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25",
              outOfStock
                ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                : "bg-zinc-900 text-white hover:bg-zinc-800",
            ].join(" ")}
          >
            {SITE_COPY.ctas.addToCart}
          </button>

          <button
            type="button"
            onClick={buyNow}
            disabled={outOfStock}
            className={[
              "inline-flex h-11 flex-1 items-center justify-center rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25",
              outOfStock
                ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                : "bg-[#d1a35a] text-white hover:brightness-95",
            ].join(" ")}
          >
            {SITE_COPY.ctas.buyNow}
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(product)}
            aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <Heart className={favorite ? "h-5 w-5 fill-current text-rose-500" : "h-5 w-5"} />
          </button>
        </div>

        <div className="border-t border-zinc-200 pt-5 text-sm text-zinc-600">
          <div className="space-y-2">
            <p>
              <span className="font-medium text-zinc-900">SKU</span>: {product.id}
            </p>
            <p>
              <span className="font-medium text-zinc-900">Tags</span>: {tags}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

