import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md";

type ButtonProps<C extends ElementType> = {
  as?: C;
  variant?: Variant;
  size?: Size;
} & ComponentPropsWithoutRef<C>;

export default function Button<C extends ElementType = "button">({
  as,
  variant = "solid",
  size = "md",
  className,
  ...props
}: ButtonProps<C>) {
  const Comp = (as ?? "button") as ElementType;

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-9 px-4 text-sm" : "h-10 px-5 text-sm",
        variant === "solid" && "bg-zinc-900 text-white hover:bg-zinc-800",
        variant === "outline" && "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
        variant === "ghost" && "bg-transparent text-zinc-900 hover:bg-zinc-100",
        className
      )}
      {...props}
    />
  );
}
