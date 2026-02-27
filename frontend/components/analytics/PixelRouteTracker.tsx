"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}

export default function PixelRouteTracker({ googleAdsId }: { googleAdsId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    const search = searchParams?.toString();
    const path = `${pathname || "/"}${search ? `?${search}` : ""}`;

    if (lastTrackedRef.current === path) return;
    lastTrackedRef.current = path;

    // Meta Pixel PageView em navegação interna
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }

    // Google tag page_path update
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("config", googleAdsId, {
        page_path: path,
      });
    }
  }, [pathname, searchParams, googleAdsId]);

  return null;
}