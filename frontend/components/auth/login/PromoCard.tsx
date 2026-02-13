import Link from "next/link";

import { ArrowRight, Sparkles } from "lucide-react";

import { LOGIN_COPY } from "@/lib/loginData";



export default function PromoCard() {

  return (

    <div className="overflow-hidden rounded-[26px] bg-zinc-900 shadow-[0_30px_90px_rgba(0,0,0,0.22)] ring-1 ring-black/10">

      <div className="p-6 sm:p-7">

        <p className="text-2xl font-semibold tracking-tight text-white">

          {LOGIN_COPY.promoTitle}

        </p>

        <p className="mt-1 text-sm text-white/60">{LOGIN_COPY.promoSubtitle}</p>



        <div className="mt-6 flex items-center justify-between">

          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10">

            <Sparkles className="h-4 w-4" />

            {LOGIN_COPY.promoBadge}

          </span>



          <Link

            href="/produtos"

            className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"

          >

            {LOGIN_COPY.promoCta}

            <ArrowRight className="h-4 w-4" />

          </Link>

        </div>

      </div>

    </div>

  );

}



