"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import {
  CONSENT_CHANGED_EVENT,
  getConsent,
  type CookieConsentValue,
} from "@/lib/privacy/cookieConsent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function subscribeConsent(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CONSENT_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, onStoreChange);
  };
}

function getConsentSnapshot() {
  return getConsent();
}

function getConsentServerSnapshot() {
  return null as CookieConsentValue | null;
}

export default function ConsentScripts() {
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  if (consent !== "accepted") return null;
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
