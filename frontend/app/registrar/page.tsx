import type { Metadata } from "next";
import RegisterShell from "@/components/auth/register/RegisterShell";

export const metadata: Metadata = {
  title: "Criar conta na Marima: cadastre-se para comprar moda fitness premium",
};

export default function RegisterPage() {
  return (
    <main className="min-h-[70vh] bg-white">
      <RegisterShell />
    </main>
  );
}
