"use client";

import React, { useEffect, useId } from "react";
import { cn, Divider, Icon } from "./ui";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const width = size === "xl" ? "max-w-6xl" : size === "lg" ? "max-w-4xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white",
          "shadow-[0_36px_100px_rgba(15,23,42,0.28)]",
          "max-h-[92dvh]",
          width
        )}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-lg font-semibold text-slate-900">
                {title}
              </h2>
              {description ? (
                <p id={descId} className="mt-1 text-sm text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-700",
                "hover:bg-slate-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              )}
              aria-label="Fechar"
            >
              <Icon name="x" />
            </button>
          </div>
        </div>

        <div className="scroll-area max-h-[calc(92dvh-150px)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>

        {footer ? (
          <>
            <Divider />
            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              {footer}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
