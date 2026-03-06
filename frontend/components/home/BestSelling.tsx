import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ExpandableProductsGrid from "@/components/ui/ExpandableProductsGrid";
import { fetchStoreProducts } from "@/lib/productsData";

export default async function BestSelling() {
  const response = await fetchStoreProducts({ limit: 40, includeVariants: true });
  const pool = response.data || [];
  const bestSelling = pool.filter((product) => product.tags?.includes("best-seller"));
  const products = (bestSelling.length ? bestSelling : pool).slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeading
          title="Mais vendidos"
          subtitle="Peças favoritas das clientes Marima para treino e rotina casual."
        />

        <div className="mt-8">
          <ExpandableProductsGrid
            products={products}
            initialCount={4}
            increment={4}
            className="gap-6"
          />
        </div>
      </Container>
    </section>
  );
}