"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import CartDrawerHeader from "./drawer/CartDrawerHeader";
import CartDrawerFooter from "./drawer/CartDrawerFooter";
import CartDrawerContent from "./drawer/CartDrawerContent";

/**
 * Drawer de carrinho (off-canvas).
 * - ARIA + foco (trap)
 * - fecha com backdrop, ESC e boto
 * - animao 300ms ease
 */
export default function CartDrawer() {
  const { isOpen, close, triggerRef } = useCart();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // ESC + focus trap
  useEffect(() => { function onKeyDown(e : KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }

      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;

        const focusables = panel.querySelectorAll<HTMLElement>('a[href], button :not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  // store/restore focus
  useEffect(() => {
    if (isOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => closeBtnRef.current?.focus());
      return;
    }

    const el = lastFocusedRef.current ?? triggerRef.current;
    requestAnimationFrame(() => el?.focus?.());
  }, [isOpen, triggerRef]);

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar carrinho"
        onClick={close}
        className={[
          "fixed inset-0 z-[60] cursor-default bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Panel */}
      <aside
        aria-hidden={!isOpen}
        className={[
          "fixed right-0 top-0 z-[70] h-full w-full max-w-[520px] transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de compras"
          className="flex h-full flex-col bg-white shadow-[0_40px_120px_rgba(0,0,0,0.25)]"
        >
          <CartDrawerHeader closeBtnRef={closeBtnRef} />
          <CartDrawerContent />
          <CartDrawerFooter />
        </div>
      </aside>
    </>
  );
}
