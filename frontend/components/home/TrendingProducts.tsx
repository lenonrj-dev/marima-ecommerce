import Container from "@/components/ui/Container";
import ExpandableProductsGrid from "@/components/ui/ExpandableProductsGrid";
import { fetchStoreProducts } from "@/lib/productsData";

export default async function TrendingProducts() {
  const response = await fetchStoreProducts({ limit: 24, includeVariants: true });
  const pool = response.data || [];
  const highlighted = pool.filter(
    (product) => product.badge === "Destaque" || product.tags?.includes("best-seller")
  );
  const products = (highlighted.length ? highlighted : pool).slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16">
      <Container className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-600">Em alta</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
              Produtos em destaque
            </h2>
          </div>
        </div>

        <ExpandableProductsGrid
          products={products}
          initialCount={4}
          increment={4}
          className="gap-4"
        />
      </Container>
    </section>
  );
}