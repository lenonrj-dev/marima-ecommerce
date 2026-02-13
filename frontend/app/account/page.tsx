import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Minha conta Marima: acesso ao dashboard, pedidos e favoritos",
  description:
    "Rota de compatibilidade da Marima para área da conta. Você será redirecionado para o dashboard do cliente.",
  pathname: "/account",
});

export default function AccountRedirectPage() {
  permanentRedirect("/dashboard");
}
