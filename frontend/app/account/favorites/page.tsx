import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Favoritos da conta Marima: acesse peças salvas e compre com agilidade",
  description:
    "Rota de compatibilidade da Marima para favoritos da conta. Você será redirecionado para o dashboard.",
  pathname: "/account/favorites",
});

export default function AccountFavoritesRedirectPage() {
  permanentRedirect("/dashboard/favoritos");
}
