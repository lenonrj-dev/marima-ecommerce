import type { Metadata } from "next";
import FavoritesGrid from "@/components/dashboard/favorites/FavoritesGrid";
import AddressBook from "@/components/dashboard/forms/AddressBook";
import OrdersTable from "@/components/dashboard/orders/OrdersTable";

export const metadata: Metadata = {
  title: "Minha conta Marima: resumo de pedidos, favoritos e endereço",
};

export default function DashboardHomePage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Resumo</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Bem-vinda à sua conta</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Acompanhe seus pedidos, gerencie favoritos e mantenha seus dados de entrega atualizados.
        </p>
      </section>

      <OrdersTable compact />
      <div className="grid gap-6 lg:grid-cols-2">
        <FavoritesGrid compact />
        <AddressBook compact />
      </div>
    </div>
  );
}
