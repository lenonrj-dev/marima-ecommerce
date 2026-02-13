import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Entrar na Marima: acesse sua conta, pedidos e favoritos com segurança",
};

export default function EntrarRedirectPage() {
  permanentRedirect("/login");
}
