import type { Metadata } from "next";
import LoginShell from "@/components/auth/login/LoginShell";
import { sanitizeNextPath } from "@/lib/authSession";

export const metadata: Metadata = {
  title: "Login Marima: acesse sua conta para pedidos, favoritos e checkout",
};

type LoginSearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const reasonParam = resolvedSearchParams.reason;
  const nextParam = resolvedSearchParams.next;
  const reason =
    typeof reasonParam === "string" ? reasonParam : Array.isArray(reasonParam) ? reasonParam[0] : undefined;
  const rawNext = typeof nextParam === "string" ? nextParam : Array.isArray(nextParam) ? nextParam[0] : undefined;
  const nextPath = sanitizeNextPath(rawNext, "/dashboard");

  return (
    <main className="min-h-[70vh] bg-white">
      <LoginShell reason={reason} nextPath={nextPath} />
    </main>
  );
}
