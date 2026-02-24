"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  CONSENT_CHANGED_EVENT,
  getConsent,
  type CookieConsentValue,
} from "@/lib/privacy/cookieConsent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function ConsentScripts() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(() => {
    if (typeof document === "undefined") return null;
    return getConsent();
  });

  useEffect(() => {
    function onConsentChanged(event: Event) {
      const customEvent = event as CustomEvent<CookieConsentValue | null>;
      setConsent(customEvent.detail ?? getConsent());
    }

    window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChanged as EventListener);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChanged as EventListener);
    };
  }, []);

  if (consent !== "all") return null;
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag("js", new Date());
          gtag("config", "${GA_MEASUREMENT_ID}");
        `}
      </Script>
    </>
  );
}
