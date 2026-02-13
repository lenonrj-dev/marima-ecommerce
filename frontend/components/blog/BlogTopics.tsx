"use client";

import { cn } from "@/lib/utils";

export default function BlogTopics({
  topics,
  value,
  onChange,
}: {
  topics: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
        Explore tópicos em alta
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {topics.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                active
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              )}
              aria-pressed={active}
            >
              <span
                className={cn("inline-block h-2 w-2 rounded-full", active ? "bg-violet-500" : "bg-zinc-300")}
                aria-hidden
              />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
