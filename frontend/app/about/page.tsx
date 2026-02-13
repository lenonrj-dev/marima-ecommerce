import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sobre a Marima Moda Fitness: história, valores e atendimento confiável",
  description:
    "Rota de compatibilidade da Marima para a página institucional. Você será redirecionado para a versão oficial em português.",
  pathname: "/sobre",
});

export default function AboutRedirectPage() {
  permanentRedirect("/sobre");
}
