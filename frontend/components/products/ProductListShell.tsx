import Link from "next/link";
import type { Product } from "@/lib/productsData";
import FiltersSidebar from "@/components/products/FiltersSidebar";
import ProductsGrid from "@/components/products/ProductsGrid";

type ProductListShellProps = {
  products: Product[];
  total: number;
  query?: string;
  category?: string;
};

export default function ProductListShell({
  products,
  total,
  query,
  category,
}: ProductListShellProps) {
  const hasFilters = Boolean(query || category);

  return (
    <section className="bg-white pb-14">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="pt-2">
          <nav aria-label="Trilha de navegação" className="text-xs text-zinc-500">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:underline">
                  Início
                </Link>
              </li>
              <li aria-hidden className="text-zinc-400">
                /
              </li>
              <li className="text-zinc-700">Loja Marima</li>
            </ol>
          </nav>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Moda Fitness Marima</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {hasFilters
              ? `${products.length} de ${total} produtos encontrados`
              : `${total} produtos para treinar com conforto e performance`}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <FiltersSidebar category={category} />
          <ProductsGrid products={products} />
        </div>
      </div>
    </section>
  );
}
