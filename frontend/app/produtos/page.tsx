import type { Metadata } from "next";
import CollectionBanner from "@/components/products/CollectionBanner";
import ProductListShell from "@/components/products/ProductListShell";
import ProductListToolbar from "@/components/products/ProductListToolbar";
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

  const response = await fetchStoreProducts({
    q: search || undefined,
    category: category || undefined,
    sort: sort || undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    includeVariants: true,
    limit: 120,
  });

  const filteredProducts = response.data;
  const totalProducts = response.meta?.total ?? filteredProducts.length;

  return (
    <main className="min-h-[60vh]">
      <ProductListToolbar search={search} category={category || undefined} sort={sort || undefined} />
      <CollectionBanner />
      <ProductListShell
        products={filteredProducts}
        total={totalProducts}
        query={search}
        category={category || undefined}
      />
    </main>
  );
}
