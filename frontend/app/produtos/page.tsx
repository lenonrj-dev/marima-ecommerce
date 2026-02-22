import type { Metadata } from "next";
import CollectionBanner from "@/components/products/CollectionBanner";
import ProductListShell from "@/components/products/ProductListShell";
import { fetchStoreProducts, type ProductSearchFilters } from "@/lib/productsData";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Catálogo Marima de Moda Fitness: leggings, tops e conjuntos premium",
  description:
    "Explore o catálogo Marima de moda fitness com leggings, tops, conjuntos, jaquetas, shorts e regatas com tecnologia têxtil e conforto premium.",
  pathname: "/produtos",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toStringValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ProdutosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = toStringValue(params.search).trim();
  const category = toStringValue(params.category).trim();
  const sort = toStringValue(params.sort).trim() as ProductSearchFilters["sort"] | "";
  const maxPrice = Number.parseFloat(toStringValue(params.maxPrice));
  const page = Math.max(1, Number.parseInt(toStringValue(params.page), 10) || 1);
  const limit = 100;

  const response = await fetchStoreProducts({
    q: search || undefined,
    category: category || undefined,
    sort: sort || undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    includeVariants: true,
    page,
    limit,
  });

  const filteredProducts = response.data;
  const meta = response.meta ?? { total: filteredProducts.length, page, limit, pages: 1 };
  const totalProducts = meta.total ?? filteredProducts.length;

  function buildPageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    if (sort) query.set("sort", sort);
    if (Number.isFinite(maxPrice)) query.set("maxPrice", String(maxPrice));
    if (targetPage > 1) query.set("page", String(targetPage));
    const qs = query.toString();
    return qs ? `/produtos?${qs}` : "/produtos";
  }

  const pagination =
    meta.pages > 1
      ? {
          page: meta.page,
          pages: meta.pages,
          prevHref: meta.page > 1 ? buildPageHref(meta.page - 1) : undefined,
          nextHref: meta.page < meta.pages ? buildPageHref(meta.page + 1) : undefined,
        }
      : undefined;

  return (
    <main className="min-h-[60vh]">
      <CollectionBanner />
      <ProductListShell
        products={filteredProducts}
        total={totalProducts}
        query={search}
        category={category || undefined}
        pagination={pagination}
      />
    </main>
  );
}
