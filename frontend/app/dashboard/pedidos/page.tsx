import type { Metadata } from "next";
import OrdersTable from "@/components/dashboard/orders/OrdersTable";

export const metadata: Metadata = {
  title: "Pedidos na conta Marima: acompanhe status, rastreio e histórico",
};

export default function DashboardPedidosPage() {
  return <OrdersTable />;
}
