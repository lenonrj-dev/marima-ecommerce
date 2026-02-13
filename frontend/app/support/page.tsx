import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Suporte Marima: central de ajuda com políticas, entrega e privacidade",
};

export default function SupportRedirectPage() {
  permanentRedirect("/central-de-ajuda");
}
