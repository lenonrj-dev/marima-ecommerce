"use client";

import Link from "next/link";
import React from "react";

export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-slate-200/75", className)} aria-hidden="true" />;
}

export type BadgeTone = "info" | "success" | "warn" | "danger" | "neutral";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80"
      : tone === "info"
      ? "bg-violet-50 text-violet-700 ring-violet-200/80"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 ring-amber-200/80"
      : tone === "danger"
      ? "bg-rose-50 text-rose-700 ring-rose-200/80"
      : "bg-slate-100 text-slate-700 ring-slate-200/90";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        "ring-1 ring-inset",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export function Button({
  href,
  onClick,
  children,
  variant = "secondary",
  size = "md",
  className,
  disabled,
  type = "button",
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl border text-center font-semibold tracking-tight",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    disabled ? "pointer-events-none opacity-55" : ""
  );

  const sizing = size === "sm" ? "h-9 px-3.5 text-xs" : "h-11 px-4.5 text-sm";

  const variantClass =
    variant === "primary"
      ? cn(
          "border-transparent bg-gradient-to-b from-[#8B5CF6] to-[#7D48D3] text-white",
          "shadow-[0_10px_28px_rgba(125,72,211,0.28)]",
          "hover:from-[#7D48D3] hover:to-[#6C39C7]"
        )
      : variant === "ghost"
      ? cn(
          "border-transparent bg-transparent text-slate-700",
          "hover:bg-violet-50/70 hover:text-violet-700"
        )
      : cn(
          "border-slate-200/90 bg-white text-slate-800",
          "shadow-[0_4px_16px_rgba(15,23,42,0.04)]",
          "hover:bg-slate-50"
        );

  const cls = cn(base, sizing, variantClass, className);

  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={disabled ? "true" : undefined}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95",
        "shadow-[0_20px_46px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-5 sm:px-6", className)}>{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>;
}

export function Input({
  label,
  hint,
  className,
  inputClassName,
  ...props
}: {
  label?: string;
  hint?: string;
  className?: string;
  inputClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("block", className)}>
      {label ? <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span> : null}
      <input
        {...props}
        className={cn(
          "h-11 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-sm text-slate-900",
          "shadow-[0_4px_16px_rgba(15,23,42,0.04)]",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-violet-300/90 focus:ring-offset-0",
          inputClassName
        )}
      />
      {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  options,
  className,
  selectClassName,
  ...props
}: {
  label?: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
  selectClassName?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={cn("block", className)}>
      {label ? <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span> : null}
      <select
        {...props}
        className={cn(
          "h-11 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-sm text-slate-900",
          "shadow-[0_4px_16px_rgba(15,23,42,0.04)]",
          "focus:outline-none focus:ring-2 focus:ring-violet-300/90",
          selectClassName
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  className,
  textareaClassName,
  ...props
}: {
  label?: string;
  className?: string;
  textareaClassName?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cn("block", className)}>
      {label ? <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span> : null}
      <textarea
        {...props}
        className={cn(
          "min-h-[130px] w-full resize-y rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 text-sm text-slate-900",
          "shadow-[0_4px_16px_rgba(15,23,42,0.04)]",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-violet-300/90",
          textareaClassName
        )}
      />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5",
        "shadow-[0_4px_16px_rgba(15,23,42,0.04)]",
        "hover:bg-slate-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
        className
      )}
    >
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-[#7D48D3]" : "bg-slate-200"
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}

export type IconName =
  | "x"
  | "home"
  | "box"
  | "cart"
  | "users"
  | "tag"
  | "chart"
  | "layers"
  | "file"
  | "plug"
  | "life"
  | "settings"
  | "search";

export function Icon({ name }: { name: IconName }) {
  const common = "h-[18px] w-[18px]";

  if (name === "x") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  const paths: Record<Exclude<IconName, "x" | "search">, string> = {
    home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z",
    box: "M4.5 7.5 12 4l7.5 3.5v9L12 20l-7.5-3.5v-9Z",
    cart: "M6 7h14l-1.5 8.5H8L6 7Zm2 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM6 7 5 4H3",
    users: "M16 20v-1.5c0-1.7-1.8-3-4-3s-4 1.3-4 3V20m10-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    tag: "M3 12l9 9 9-9V4H12L3 12Zm13-5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
    chart: "M5 19V5m4 14V9m4 10V7m4 12v-8",
    layers: "M12 4 3 9l9 5 9-5-9-5Zm0 10-9 5 9 5 9-5-9-5Z",
    file: "M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z",
    plug: "M9 3v6m6-6v6m-8 4h10v3a5 5 0 0 1-5 5v3a1 1 0 0 1-2 0v-3a5 5 0 0 1-5-5v-3Z",
    life: "M12 2a7 7 0 0 0-7 7v2a7 7 0 0 0 7 7 7 7 0 0 0 7-7V9a7 7 0 0 0-7-7Zm-2 8h4m-2-2v4",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.5-3.5-2 .5a7.8 7.8 0 0 1-.6 1.4l1.2 1.7-1.8 1.8-1.7-1.2c-.5.2-1 .4-1.5.6l-.5 2h-2.5l-.5-2c-.5-.1-1-.3-1.5-.6l-1.7 1.2-1.8-1.8 1.2-1.7c-.2-.5-.4-1-.6-1.5l-2-.5v-2.5l2-.5c.1-.5.3-1 .6-1.5L4.7 6.5l1.8-1.8 1.7 1.2c.5-.2 1-.4 1.5-.6l.5-2h2.5l.5 2c.5.1 1 .3 1.5.6l1.7-1.2 1.8 1.8-1.2 1.7c.2.5.4 1 .6 1.5l2 .5v2.5Z",
  };

  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={paths[name as Exclude<IconName, "x" | "search">]}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
