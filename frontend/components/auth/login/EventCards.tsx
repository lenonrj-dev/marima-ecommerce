import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LOGIN_COPY } from "@/lib/loginData";

export default function EventCards() {
  return (
    <div className="relative overflow-hidden rounded-[34px] bg-white/55 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)] ring-1 ring-black/10 backdrop-blur-xl sm:p-7 md:min-h-[453px]">
      {/* Big orange orb behind cards */}
      <div
        className="pointer-events-none absolute left-[58%] top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ffbf7a] via-[#ff8a3a] to-[#ff6a2a]"
        aria-hidden
      />

      {/* Subtle inner highlight */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-white/35"
        aria-hidden
      />

      <div className="relative grid h-full gap-6 sm:grid-cols-[200px_1fr] sm:items-stretch">
        {/* Date card */}
        <div className="relative overflow-hidden rounded-[26px] bg-white/85 p-6 ring-1 ring-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
          {/* Warm blur inside card */}
          <div
            className="pointer-events-none absolute bottom-[-60px] left-1/2 h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#ffbf7a] via-[#ff8a3a] to-[#ff6a2a] blur-[1px] opacity-80"
            aria-hidden
          />

          <div className="relative flex h-full flex-col">
            <div>
              <p className="text-[46px] font-semibold leading-none tracking-tight text-zinc-900">
                {LOGIN_COPY.date.day}
              </p>
              <p className="mt-1 text-[46px] font-light leading-none tracking-tight text-zinc-400">
                {LOGIN_COPY.date.num}
              </p>
            </div>

            <div className="mt-10 space-y-1 text-xs text-zinc-700">
              <p className="font-semibold">{LOGIN_COPY.date.time}</p>
              <p>{LOGIN_COPY.date.street}</p>
              <p>{LOGIN_COPY.date.city}</p>
            </div>

            <div className="mt-auto pt-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/70 ring-1 ring-black/10">
                  M
                </span>
                {LOGIN_COPY.date.brand}
              </div>
            </div>
          </div>
        </div>

        {/* Event info card */}
        <div className="relative overflow-hidden rounded-[26px] bg-white/85 p-6 ring-1 ring-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
          <div className="relative flex h-full flex-col">
            <div className="ml-auto text-right">
              <p className="text-xs font-semibold text-zinc-500">{LOGIN_COPY.event.small}</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">{LOGIN_COPY.event.title}</p>
            </div>

            {/* Spacer to keep the same airy look */}
            <div className="mt-auto" />
          </div>
        </div>

        {/* Join button (outside cards, bottom-right like the reference) */}
        <Link
          href="/"
          aria-label="Ver coleção"
          className="group absolute bottom-4 right-4 inline-flex h-11 items-center gap-3 rounded-full bg-zinc-900 px-4 text-xs font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:bottom-5 sm:right-5"
        >
          {LOGIN_COPY.event.cta}
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
