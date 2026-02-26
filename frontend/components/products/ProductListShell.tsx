import Link from "next/link";
import type { CategoryFacet, Product } from "@/lib/productsData";
import FiltersSidebar from "@/components/products/FiltersSidebar";
import ProductsGrid from "@/components/products/ProductsGrid";

type ProductListShellProps = {
  products: Product[];
  total: number;
  query?: string;
  category?: string;
  sort?: string;
  maxPrice?: number;
  categoryFacets: CategoryFacet[];
  categoriesTotalCount?: number;
  pagination?: {
    page: number;
    pages: number;
    prevHref?: string;
    nextHref?: string;
  };
};

export default function ProductListShell({
  products,
  total,
  query,
  category,
  sort,
  maxPrice,
  categoryFacets,
  categoriesTotalCount,
  pagination,
}: ProductListShellProps) {
  const hasFilters = Boolean(query || category);
  const shown = products.length;
  const showXofY = total > shown;

  const subtitle =
    total === 0
      ? "Nenhum produto encontrado"
      : showXofY
        ? `${shown} de ${total} produtos encontrados`
        : hasFilters
          ? `${shown} produtos encontrados`
          : `${total} produtos para treinar com conforto e performance`;

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
          <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <FiltersSidebar
            category={category}
            categories={categoryFacets}
            search={query}
            sort={sort}
            maxPrice={maxPrice}
            totalCount={categoriesTotalCount}
          />
          <ProductsGrid products={products} />
        </div>

        {pagination && pagination.pages > 1 ? (
          <div className="mt-10 flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600">
              Página <span className="font-medium text-zinc-900">{pagination.page}</span> de{" "}
              <span className="font-medium text-zinc-900">{pagination.pages}</span>
            </p>

            <div className="flex items-center gap-2">
              {pagination.prevHref ? (
                <Link
                  href={pagination.prevHref}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
                >
                  Anterior
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400"
                >
                  Anterior
                </span>
              )}

              {pagination.nextHref ? (
                <Link
                  href={pagination.nextHref}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
                >
                  Próxima
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400"
                >
                  Próxima
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
