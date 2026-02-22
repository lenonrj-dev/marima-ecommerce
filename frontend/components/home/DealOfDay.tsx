"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { DEAL_BANNER2 } from "@/lib/homeData";
import { SITE_COPY } from "@/lib/siteCopy";
import { useWeeklyDealCountdown } from "@/lib/useWeeklyDealCountdown";

export default function DealOfDay() {
  const { days, hours, minutes, seconds, mounted } = useWeeklyDealCountdown();

  const countdownItems = [
    { k: "H", v: mounted ? hours : "--" },
    { k: "M", v: mounted ? minutes : "--" },
    { k: "S", v: mounted ? seconds : "--" },
    { k: "D", v: mounted ? days : "--" },
  ];

  return (
    <section className="bg-white py-12">
      <Container>
        <div className= "grid gap-6 overflow-hidden rounded-3xl bg-zinc-50 shadow-soft lg:grid-cols-12">
          <div className="relative min-h-[520px] lg:col-span-6">
            <Image src={DEAL_BANNER2} alt="Oferta especial Marima" fill className="object-cover" />
          </div>

          <div className="relative mt-20 px-7 py-10 lg:col-span-6 lg:px-10">
            <div className="absolute right-6 top-[-10px] grid h-16 w-16 place-items-center rounded-full border border-zinc-300 bg-white text-xs font-semibold text-zinc-900">
              30% <br /> OFF
            </div>

            <p className="text-xs font-medium text-zinc-500">OFERTA DA SEMANA</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              Moda fitness premium com preço especial por tempo limitado
            </h3>
            <p className="mt-3 text-sm text-zinc-600">
              Garanta peças com tecido tecnológico, compressão confortável e alta durabilidade.
            </p>

            <div className="mt-6 grid grid-cols-4 gap-3">
              {countdownItems.map((x) => (
                <div key={x.k} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-center">
                  <p className="text-lg font-semibold text-zinc-900">{x.v}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{x.k}</p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <Button as={Link} href="/produtos" className="rounded-full">
                {SITE_COPY.ctas.buyNow}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}


