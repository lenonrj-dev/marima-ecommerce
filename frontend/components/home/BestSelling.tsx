import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/ui/ProductCard";
import MobileProductCarousel from "@/components/home/MobileProductCarousel";
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

        <MobileProductCarousel className="mt-8" carouselClassName="gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href={`/produtos/${product.slug}`} />
          ))}
        </MobileProductCarousel>
      </Container>
    </section>
  );
}
