"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { fetchStoreProducts, type Product } from "@/lib/productsData";
import { formatMoney } from "@/lib/cart/utils";
import { useCart } from "../../CartProvider";

export default function CartCrossSell() {
  const { addProduct, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const cartIds = useMemo(() => new Set(items.map((item) => item.productId)), [items]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const response = await fetchStoreProducts({ limit: 10, sort: "newest" });
      if (!active) return;
      setProducts(response.data || []);
      setLoading(false);
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
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">VocÃª tambÃ©m pode gostar</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-xl bg-zinc-100" />
          <div className="h-28 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-900">VocÃª tambÃ©m pode gostar</p>

      <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
        {suggestions.map((product) => (
          <div key={product.id} className="min-w-0 overflow-hidden rounded-xl bg-zinc-50 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                <Image src={product.image} alt={product.title} fill className="object-cover" sizes="48px" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{product.title}</p>
                <p className="truncate text-xs text-zinc-600">{product.description}</p>
                <p className="mt-1 text-xs font-semibold text-zinc-900">
                  {formatMoney(Math.round(product.price * 100))}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addProduct(product, { qty: 1 })}
              disabled={product.stock <= 0}
              className={[
                "mt-3 inline-flex h-10 w-full min-w-0 items-center justify-center rounded-md text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                product.stock <= 0
                  ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                  : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
              ].join(" ")}
            >
              Adicionar ao carrinho
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
