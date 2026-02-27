"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getConsent, setConsent, type CookieConsentValue } from "@/lib/privacy/cookieConsent";

const RUNTIME_CONSENT_KEY = "marima_cookie_consent_runtime";

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const bannerRef = useRef<HTMLElement>(null);
  const previousBodyPaddingRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const frame = window.requestAnimationFrame(() => {
      setMounted(true);

      try {
        const runtimeChoice = window.sessionStorage.getItem(RUNTIME_CONSENT_KEY);
        if (runtimeChoice === "accepted" || runtimeChoice === "declined") {
          setOpen(false);
          return;
        }

        const consent = getConsent();
        setOpen(consent === null);
      } catch {
        setOpen(true);
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !open) return;
    firstButtonRef.current?.focus();
  }, [mounted, open]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!mounted || !open) {
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

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && bannerRef.current) {
      resizeObserver = new ResizeObserver(() => applyBodyOffset());
      resizeObserver.observe(bannerRef.current);
    } else {
      window.addEventListener("resize", applyBodyOffset);
    }

    return () => {
      resizeObserver?.disconnect();
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
  }, [mounted, open]);

  function handleChoice(choice: CookieConsentValue) {
    setOpen(false);

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(RUNTIME_CONSENT_KEY, choice);
      }
      setConsent(choice);
    } catch {
      // Mesmo se o storage falhar, o banner deve sumir nesta sessão.
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(RUNTIME_CONSENT_KEY, choice);
        } catch {
          // noop
        }
      }
    }
  }

  if (!mounted || !open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 flex justify-center px-4 pointer-events-none"
      style={{
        zIndex: 2147483647,
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="w-full max-w-[720px] pointer-events-auto">
        <section
          ref={bannerRef}
          role="dialog"
          aria-live="polite"
          aria-label="Preferências de cookies"
          aria-describedby="cookie-consent-description"
          className="relative isolate w-full rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.14)] sm:p-5"
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
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
                onClick={() => handleChoice("declined")}
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                Recusar
              </button>
              <button
                type="button"
                onClick={() => handleChoice("accepted")}
                className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                Aceitar
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
