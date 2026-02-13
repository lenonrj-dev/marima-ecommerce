"use client";

import { useMemo } from "react";
import { useReducedMotion, type Variants } from "framer-motion";

type VariantLike = Variants;

export function staggerContainer(stagger = 0.08, delayChildren = 0) { const base : VariantLike = { hidden : {},
    show: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };

  return base;
}

export function fadeInUp(delay = 0, duration = 0.55): VariantLike {
  return {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };
}

export function slideInLeft(delay = 0, duration = 0.55): VariantLike {
  return {
    hidden: { opacity: 0, x: -18 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };
}

export function slideInRight(delay = 0, duration = 0.55): VariantLike {
  return {
    hidden: { opacity: 0, x: 18 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };
}

export function textReveal(delay = 0, duration = 0.5): VariantLike {
  return {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };
}

export function imageReveal(delay = 0, duration = 0.6): VariantLike {
  return {
    hidden: { opacity: 0, scale: 0.98 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };
}

export function useMotionSafeProps() {
  const reduced = useReducedMotion();

  return useMemo(() => {
    if (!reduced) return {};
    return {
      initial: false,
      animate: false,
      whileInView: undefined,
      variants: undefined,
    } as const;
  }, [reduced]);
}
