import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.reason;
  const reason = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  return <LoginClient reason={reason} />;
}
