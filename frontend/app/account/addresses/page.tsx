import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Endereços da conta Marima: gerencie entregas e dados com segurança",
  description:
    "Rota de compatibilidade da Marima para endereços da conta. Você será redirecionado para o dashboard.",
  pathname: "/account/addresses",
});

export default function AccountAddressesRedirectPage() {
  permanentRedirect("/dashboard/endereco");
}
