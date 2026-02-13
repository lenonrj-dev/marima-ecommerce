"use client";

import { cn } from "./ui";

export function MiniBars({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(1, ...values);

  return (
    <div className={cn("flex h-20 items-end gap-1.5", className)} aria-hidden="true">
      {values.map((value, index) => (
        <div
          key={index}
          className={cn(
            "w-3 rounded-md transition-all duration-300",
            index % 2 === 0
              ? "bg-gradient-to-t from-[#7D48D3] to-[#9F75FF]"
              : "bg-gradient-to-t from-[#D7C8FF] to-[#EFEAFF]"
          )}
          style={{ height: `${Math.round((value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function MiniLine({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const width = 260;
  const height = 80;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className={cn("w-full", className)} aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full">
        <defs>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9F75FF" />
            <stop offset="100%" stopColor="#7D48D3" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="url(#lineStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#7D48D3"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.08"
        />
      </svg>
    </div>
  );
}

export function PillsTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-[#F6F4FC] p-1.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
              active
                ? "bg-white text-violet-700 shadow-[0_8px_22px_rgba(125,72,211,0.18)]"
                : "text-slate-700 hover:bg-white/75"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
