"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import CartDrawerHeader from "./drawer/CartDrawerHeader";
import CartDrawerFooter from "./drawer/CartDrawerFooter";
import CartDrawerContent from "./drawer/CartDrawerContent";

export default function CartDrawer() {
  const { isOpen, close, triggerRef } = useCart();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => closeBtnRef.current?.focus());
      return;
    }

    const target = lastFocusedRef.current ?? triggerRef.current;
    requestAnimationFrame(() => target?.focus?.());
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Fechar carrinho"
        onClick={close}
        className={[
          "fixed inset-0 z-[70] bg-black/45 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        aria-hidden={!isOpen}
        className={[
          "fixed right-0 top-0 z-[80] h-full w-full max-w-[420px] transform overflow-hidden transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none",
        ].join(" ")}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de compras"
          className="flex h-full flex-col overflow-hidden bg-white shadow-[0_36px_100px_rgba(0,0,0,0.28)]"
        >
          <CartDrawerHeader closeBtnRef={closeBtnRef} />
          <CartDrawerContent />
          <CartDrawerFooter />
        </div>
      </aside>
    </>
  );
}
