import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductListToolbar from "@/components/products/ProductListToolbar";
import ProductDetailsMain from "@/components/products/details/ProductDetailsMain";
import ProductDetailsTabs from "@/components/products/details/ProductDetailsTabs";
import MoreNeeds from "@/components/products/MoreNeeds";
import { fetchStoreProductBySlug, fetchStoreProductVariantsBySlug, fetchStoreProducts } from "@/lib/productsData";
import { canonical } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

function buildProductTitle(productName: string) {
  const suffix = " na Marima: detalhes, preço, frete e entrega rápida";
  const maxTotal = 68;
  const maxName = Math.max(12, maxTotal - suffix.length);
  const normalizedName =
    productName.length > maxName ? `${productName.slice(0, Math.max(0, maxName - 3)).trimEnd()}...` : productName;
  return `${normalizedName}${suffix}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchStoreProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto não encontrado na Marima: confira novidades de moda fitness",
      description: "Este produto não está mais disponível na Marima.",
      alternates: {
        canonical: canonical(`/produtos/${slug}`),
      },
    };
  }

  return {
    title: buildProductTitle(product.title),
    description: product.description,
    alternates: {
      canonical: canonical(`/produtos/${slug}`),
    },
  };
}

export default async function ProdutoDetalhesPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await fetchStoreProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const variants = product.groupKey ? await fetchStoreProductVariantsBySlug(product.slug) : null;

  const relatedResponse = await fetchStoreProducts({
    category: product.category,
    includeVariants: true,
    limit: 12,
  });

  const related = relatedResponse.data.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <main className="min-h-[60vh] bg-white">
      <ProductListToolbar />
      <ProductDetailsMain product={product} variants={variants} />
      <ProductDetailsTabs product={product} />
      <MoreNeeds products={related} currentSlug={product.slug} />
    </main>
  );
}
