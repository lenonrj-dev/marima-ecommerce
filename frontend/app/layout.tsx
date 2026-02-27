import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import CookieConsentBanner from "@/components/privacy/CookieConsentBanner";
import ConsentScripts from "@/components/privacy/ConsentScripts";
import { SITE_COPY } from "@/lib/siteCopy";
import { SITE_URL } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PixelRouteTracker from "@/components/analytics/PixelRouteTracker";

const inter = Inter({ subsets: ["latin"] });

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-17870927642";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1311314403687031";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_COPY.seo.title,
    template: `%s | ${SITE_COPY.brand}`,
  },
  description: SITE_COPY.seo.description,
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <Script
          id="google-ads-gtag-src"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = window.gtag || gtag;
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>

        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !(function(f,b,e,v,n,t,s){
              if(f.fbq) return;
              n=f.fbq=function(){n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)};
              if(!f._fbq) f._fbq=n;
              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];
              t=b.createElement(e); t.async=!0; t.src=v;
              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s);
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        <CartProvider>
          <Suspense fallback={null}>
            <PixelRouteTracker googleAdsId={GOOGLE_ADS_ID} />
          </Suspense>

          <SiteHeader />
          {children}
          <SiteFooter />
          <CartDrawer />
          <ConsentScripts />
        </CartProvider>
        <CookieConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
