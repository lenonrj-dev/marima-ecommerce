"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import IconButton from "@/components/ui/IconButton";

type MobileProductCarouselProps = {
  children: React.ReactNode;
  className?: string;
  carouselClassName?: string;
  ariaLabel?: string;
};

export default function MobileProductCarousel({
  children,
  className,
  carouselClassName,
  ariaLabel = "Carrossel de produtos",
}: MobileProductCarouselProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const scrollByDirection = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;

    const firstItem = el.firstElementChild as HTMLElement | null;
    const styles = window.getComputedStyle(el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
    const width = firstItem?.getBoundingClientRect().width ?? el.clientWidth;
    const delta = width + gap;

    el.scrollBy({ left: dir === "left" ? -delta : delta, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div className="mb-4 flex items-center justify-end gap-3 sm:hidden">
        <IconButton type="button" aria-label="Ver produtos anteriores" onClick={() => scrollByDirection("left")}>
          <ChevronLeft className="h-4.5 w-4.5" />
        </IconButton>
        <IconButton type="button" aria-label="Ver proximos produtos" onClick={() => scrollByDirection("right")}>
          <ChevronRight className="h-4.5 w-4.5" />
        </IconButton>
      </div>

      <div
        ref={ref}
        aria-label={ariaLabel}
        tabIndex={0}
        className={cn("mobile-products-carousel", carouselClassName)}
      >
        {children}
      </div>
    </div>
  );
}

