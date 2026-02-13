import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { canonical } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Produto Marima Moda Fitness: detalhes, preço e entrega rápida",
    description:
      "Rota de compatibilidade da Marima para página de produto. Você será redirecionado para a versão oficial em português.",
    alternates: {
      canonical: canonical(`/produtos/${slug}`),
    },
  };
}

export default async function ProductRedirectPage({ params }: { params: Params }) {
  const { slug } = await params;
  permanentRedirect(`/produtos/${slug}`);
}
