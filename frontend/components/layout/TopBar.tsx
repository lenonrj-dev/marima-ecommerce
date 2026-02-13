import Link from "next/link";
import { ArrowRight, BadgePercent, Truck } from "lucide-react";
import Container from "@/components/ui/Container";

export default function TopBar() {
  return (
    <div
      role="region"
      aria-label="Avisos da loja"
      className="w-full border-b border-zinc-200/70 bg-zinc-50"
    >
      <Container>
        <div className="flex h-9 flex-wrap items-center justify-center gap-x-4 gap-y-1 px-1 text-[12px] text-zinc-700 sm:text-sm">
          <div className="inline-flex items-center gap-2 whitespace-nowrap">
            <Truck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>Frete grátis para toda a região Sul Fluminense</span>
          </div>

          <span className="hidden h-4 w-px bg-zinc-300/60 sm:block" aria-hidden="true" />

          <div className="inline-flex items-center gap-2 whitespace-nowrap">
            <BadgePercent className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>40% OFF em todas as peças</span>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1 font-semibold text-zinc-900 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40"
              aria-label="Aproveite agora"
            >
              Aproveite agora
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
