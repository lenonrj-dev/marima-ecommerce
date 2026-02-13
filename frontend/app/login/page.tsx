import type { Metadata } from "next";
import LoginShell from "@/components/auth/login/LoginShell";

export const metadata: Metadata = {
  title: "Login Marima: acesse sua conta para pedidos, favoritos e checkout",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.reason;
  const reason = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;

  return (
    <main className="min-h-[70vh] bg-white">
      <LoginShell reason={reason} />
    </main>
  );
}
