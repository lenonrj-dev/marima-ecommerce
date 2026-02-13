import type { Metadata } from "next";
import AddressBook from "@/components/dashboard/forms/AddressBook";

export const metadata: Metadata = {
  title: "Endereços na conta Marima: gerencie locais de entrega com praticidade",
};

export default function DashboardEnderecoPage() {
  return <AddressBook />;
}
