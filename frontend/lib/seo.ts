import type { Metadata } from "next";

function normalizeBaseUrl(raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";

    let pathname = parsed.pathname || "";
    if (pathname === "/") pathname = "";
    else pathname = pathname.replace(/\/+$/, "");

    return `${parsed.origin}${pathname}`;
  } catch {
    return value.replace(/\/+$/, "");
  }
}

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

export const SITE_URL = normalizeBaseUrl(resolveSiteUrl());

if (process.env.VERCEL_ENV === "production" && SITE_URL.startsWith("http://")) {
  throw new Error("Config inválida: NEXT_PUBLIC_SITE_URL deve ser HTTPS em produção.");
}

export function canonical(pathname: string) {
  const normalized = pathname === "/" ? "" : pathname;
  return `${SITE_URL}${normalized}`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  pathname: string;
};

export function pageMetadata({ title, description, pathname }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: canonical(pathname),
    },
  };
}
