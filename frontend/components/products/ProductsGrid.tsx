import ProductCard from "@/components/ui/ProductCard";
import { type Product } from "@/lib/productsData";

export default function ProductsGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
        Nenhum produto encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} href={`/produtos/${product.slug}`} />
      ))}
    </div>
  );
}
