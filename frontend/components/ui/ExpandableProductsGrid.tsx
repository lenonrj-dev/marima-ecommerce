"use client";

import { useState } from "react";
import ProductCard from "@/components/ui/ProductCard";
import { type Product } from "@/lib/productsData";

type ExpandableProductsGridProps = {
  products: Product[];
  initialCount?: number;
  increment?: number;
  className?: string;
};

export default function ExpandableProductsGrid({
  products,
  initialCount = 4,
  increment = 4,
  className = "",
}: ExpandableProductsGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;
  const canToggle = products.length > initialCount;

  const handleToggle = () => {
    if (hasMore) {
      setVisibleCount((current) => Math.min(current + increment, products.length));
      return;
    }

    setVisibleCount(initialCount);
  };

  return (
    <div>
      <div className={`grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} href={`/produtos/${product.slug}`} />
        ))}
      </div>

      {canToggle ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleToggle}
            className="cursor-pointer text-sm font-semibold text-zinc-900 underline underline-offset-4 transition hover:text-zinc-700"
          >
            {hasMore ? "Carregar mais" : "Carregar menos"}
          </button>
        </div>
      ) : null}
    </div>
  );
}