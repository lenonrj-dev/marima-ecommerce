"use client";

import Image from "next/image";
import { Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchStoreProducts, type Product } from "@/lib/productsData";
import { formatMoney } from "@/lib/cart/utils";
import { useCart } from "../../CartProvider";

export default function CartUpsell() {
  const { addProduct, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const cartIds = useMemo(() => new Set(items.map((item) => item.productId)), [items]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const offer = await fetchStoreProducts({ status: "oferta", limit: 8 });
        const highlight =
          offer.data.length > 0 ? offer : await fetchStoreProducts({ status: "destaque", limit: 8 });
        const fallback = highlight.data.length > 0 ? highlight : await fetchStoreProducts({ limit: 8 });

        if (!active) return;
        setProducts(fallback.data || []);
      } catch {
        if (!active) return;
        setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(
    () => products.filter((product) => !cartIds.has(product.id)).slice(0, 2),
    [cartIds, products],
  );

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900">Upgrade seu pedido</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white">
            <Gift className="h-3.5 w-3.5" />
            Oferta
          </span>
        </div>

        <div className="mt-3 space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-zinc-100" />
          <div className="h-20 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">Upgrade seu pedido</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white">
          <Gift className="h-3.5 w-3.5" />
          Oferta
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {suggestions.map((product) => {
          const title =
            typeof product.title === "string" && product.title.trim() ? product.title : "Produto sugerido";

          const description =
            typeof product.description === "string" && product.description.trim()
              ? product.description
              : "Adicione ao carrinho para complementar seu pedido.";

          const priceCents = Math.round(product.price * 100);
          const compareAtCents =
            typeof product.compareAtPrice === "number" ? Math.round(product.compareAtPrice * 100) : null;

          return (
            <div key={product.id} className="overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50 p-3">
              <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                  <Image src={product.image} alt={title} fill className="object-cover" sizes="48px" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{title}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-600">{description}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs font-semibold text-zinc-900">+ {formatMoney(priceCents)}</span>

                    {compareAtCents ? (
                      <span className="text-xs font-medium text-zinc-500 line-through">
                        {formatMoney(compareAtCents)}
                      </span>
                    ) : null}

                    {typeof product.stock === "number" ? (
                      <span className="text-[11px] text-zinc-500">{product.stock > 0 ? "Em estoque" : "Sem estoque"}</span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addProduct(product, { qty: 1 })}
                  disabled={product.stock <= 0}
                  className={[
                    "col-span-2 inline-flex h-10 w-full items-center justify-center rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:col-span-1 sm:w-auto sm:min-w-[112px]",
                    product.stock <= 0
                      ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                      : "bg-zinc-900 text-white hover:bg-zinc-800",
                  ].join(" ")}
                  aria-label={`Adicionar ${title} ao carrinho`}
                >
                  {product.stock <= 0 ? "Indisponível" : "Adicionar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}