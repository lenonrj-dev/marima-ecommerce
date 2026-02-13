import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pedidos da conta Marima: acompanhe rastreio e histórico completo",
  description:
    "Rota de compatibilidade da Marima para pedidos da conta. Você será redirecionado para o dashboard.",
  pathname: "/account/orders",
});

export default function AccountOrdersRedirectPage() {
  permanentRedirect("/dashboard/pedidos");
}
