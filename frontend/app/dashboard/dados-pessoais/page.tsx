import type { Metadata } from "next";
import ProfileForm from "@/components/dashboard/forms/ProfileForm";

export const metadata: Metadata = {
  title: "Dados pessoais na conta Marima: atualize perfil e dados com segurança",
};

export default function DashboardDadosPessoaisPage() {
  return <ProfileForm />;
}
