import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Catálogo Marima Moda Fitness: redirecionamento oficial para produtos",
  description:
    "Rota de compatibilidade da Marima para catálogo de produtos. Você será redirecionado para a versão oficial em português.",
  pathname: "/produtos",
});

export default function ProductsRedirectPage() {
  permanentRedirect("/produtos");
}
