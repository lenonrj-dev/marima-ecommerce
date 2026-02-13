import Container from "@/components/ui/Container";
import ProductCard from "@/components/ui/ProductCard";
import type { Product } from "@/lib/productsData";

export default function MoreNeeds({
  currentSlug,
  products,
}: {
  currentSlug: string;
  products?: Product[];
}) {
  const more = (products || []).filter((product) => product.slug !== currentSlug);

  return (
    <section className="bg-white py-12 sm:py-16">
      <Container className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Mais peças para você
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Explore recomendações pensadas para seu estilo de treino e rotina.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((product) => (
            <ProductCard key={product.id} product={product} href={`/produtos/${product.slug}`} />
          ))}
        </div>
      </Container>
    </section>
  );
}
