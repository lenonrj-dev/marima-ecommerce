import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Admin • CRM de E-commerce",
    template: "%s • Admin",
  },
  description: "Dashboard e CRM premium para operação de e-commerce.",
  metadataBase: new URL("http://localhost:3000"),
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
