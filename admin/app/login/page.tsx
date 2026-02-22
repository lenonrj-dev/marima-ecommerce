import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login",
};

type LoginSearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const raw = resolvedSearchParams.reason;
  const reason = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  return <LoginClient reason={reason} />;
}
