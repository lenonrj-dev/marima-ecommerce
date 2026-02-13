import type { Metadata } from "next";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Finalizar compra na Marima com frete, entrega e confirmação segura",
  description:
    "Finalize sua compra na Marima com resumo do pedido, entrega e fluxo de pagamento pronto para Mercado Pago.",
};

export default function CheckoutPage() {
  return (
    <main className="min-h-[60vh] bg-white">
      <CheckoutClient />
    </main>
  );
}
