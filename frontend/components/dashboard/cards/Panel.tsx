"use client";

import { cn } from "@/lib/utils";

export default function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white shadow-soft",
        className,
      )}
    >
      {children}
    </div>
  );
}
