import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import CookieConsentBanner from "@/components/privacy/CookieConsentBanner";
import ConsentScripts from "@/components/privacy/ConsentScripts";
import { SITE_COPY } from "@/lib/siteCopy";
import { SITE_URL } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

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
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CartDrawer />
          <ConsentScripts />
        </CartProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
