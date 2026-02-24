"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Container from "@/components/ui/Container";
import { getConsent, setConsent, type CookieConsentValue } from "@/lib/privacy/cookieConsent";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === "undefined") return false;
    return getConsent() === null;
  });
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    titleRef.current?.focus();
  }, [isVisible]);

  function handleChoice(choice: CookieConsentValue) {
    setConsent(choice);
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <Container className="px-0 sm:px-0 lg:px-0">
        <section
          role="dialog"
          aria-live="polite"
          aria-label="Preferências de cookies"
          className="pointer-events-auto mx-auto w-full max-w-[980px] rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-sm sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-2">
              <h2
                ref={titleRef}
                tabIndex={-1}
                className="text-sm font-semibold tracking-tight text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Usamos cookies para manter sua sessão e melhorar sua experiência.
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                Ao aceitar, você permite cookies de desempenho e marketing. Ao recusar, manteremos apenas cookies
                essenciais para login, carrinho e segurança.
              </p>
              <Link
                href="/central-de-ajuda/privacidade"
                className="inline-flex text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                Ler Política de Privacidade
              </Link>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => handleChoice("necessary")}
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                Recusar
              </button>
              <button
                type="button"
                onClick={() => handleChoice("all")}
                className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                Aceitar
              </button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
