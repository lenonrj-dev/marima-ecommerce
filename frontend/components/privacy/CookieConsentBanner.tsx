"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  CONSENT_CHANGED_EVENT,
  getConsent,
  setConsent,
  type CookieConsentValue,
} from "@/lib/privacy/cookieConsent";

function subscribeConsent(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CONSENT_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, onStoreChange);
  };
}

function getConsentSnapshot() {
  return getConsent() === null;
}

function getConsentServerSnapshot() {
  return false;
}

export default function CookieConsentBanner() {
  const isVisible = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const bannerRef = useRef<HTMLElement>(null);
  const previousBodyPaddingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    firstButtonRef.current?.focus();
  }, [isVisible]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!isVisible) {
      if (previousBodyPaddingRef.current !== null) {
        if (previousBodyPaddingRef.current) {
          document.body.style.paddingBottom = previousBodyPaddingRef.current;
        } else {
          document.body.style.removeProperty("padding-bottom");
        }
        previousBodyPaddingRef.current = null;
      }
      return;
    }

    if (previousBodyPaddingRef.current === null) {
      previousBodyPaddingRef.current = document.body.style.paddingBottom;
    }

    const applyBodyOffset = () => {
      const height = bannerRef.current?.offsetHeight ?? 0;
      document.body.style.paddingBottom = `${height + 24}px`;
    };

    applyBodyOffset();
    window.addEventListener("resize", applyBodyOffset);

    return () => {
      window.removeEventListener("resize", applyBodyOffset);
      if (previousBodyPaddingRef.current !== null) {
        if (previousBodyPaddingRef.current) {
          document.body.style.paddingBottom = previousBodyPaddingRef.current;
        } else {
          document.body.style.removeProperty("padding-bottom");
        }
        previousBodyPaddingRef.current = null;
      }
    };
  }, [isVisible]);

  function handleChoice(choice: CookieConsentValue) {
    try {
      setConsent(choice);
    } catch {
      // Ignore persistence failures and keep UX responsive.
    }
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-1/2 z-[90] w-[calc(100%-1.5rem)] max-w-[720px] -translate-x-1/2 sm:bottom-[calc(env(safe-area-inset-bottom)+24px)] sm:w-[calc(100%-2rem)]">
      <section
        ref={bannerRef}
        role="dialog"
        aria-live="polite"
        aria-label="Preferências de cookies"
        aria-describedby="cookie-consent-description"
        className="w-full rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.14)] sm:p-5"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="text-sm font-semibold tracking-tight text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Usamos cookies para manter sua sessão e melhorar sua experiência.
            </h2>
            <p id="cookie-consent-description" className="text-sm leading-relaxed text-zinc-600">
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

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              ref={firstButtonRef}
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
    </div>
  );
}
