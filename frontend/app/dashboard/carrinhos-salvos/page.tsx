import type { Metadata } from "next";
import SavedCartsPanel from "@/components/dashboard/carts/SavedCartsPanel";

export const metadata: Metadata = {
  title: "Carrinhos salvos da Marima para recuperar e finalizar compra",
};

export default function DashboardSavedCartsPage() {
  return <SavedCartsPanel />;
}
