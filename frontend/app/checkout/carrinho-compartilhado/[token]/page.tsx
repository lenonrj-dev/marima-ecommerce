import type { Metadata } from "next";
import SharedCartClient from "@/components/cart/shared/SharedCartClient";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export const metadata: Metadata = {
  title: "Carrinho compartilhado | Marima",
  description: "Importe um carrinho compartilhado para finalizar sua compra na Marima.",
};

export default async function SharedCartPage({ params }: PageProps) {
  const { token } = await params;
  return <SharedCartClient token={token} />;
}
