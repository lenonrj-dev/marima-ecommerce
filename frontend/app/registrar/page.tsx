import type { Metadata } from "next";
import RegisterShell from "@/components/auth/register/RegisterShell";
import { sanitizeNextPath } from "@/lib/authSession";

export const metadata: Metadata = {
  title: "Criar conta na Marima: cadastre-se para comprar moda fitness premium",
};

type RegisterSearchParams = Record<string, string | string[] | undefined>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<RegisterSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextParam = resolvedSearchParams.next;
  const rawNext = typeof nextParam === "string" ? nextParam : Array.isArray(nextParam) ? nextParam[0] : undefined;
  const nextPath = sanitizeNextPath(rawNext, "/dashboard");

  return (
    <main className="min-h-[70vh] bg-white">
      <RegisterShell nextPath={nextPath} />
    </main>
  );
}
