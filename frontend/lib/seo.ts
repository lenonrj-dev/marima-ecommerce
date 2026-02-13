import type { Metadata } from "next";

export const SITE_URL = "https://www.usemarima.com.br";

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
