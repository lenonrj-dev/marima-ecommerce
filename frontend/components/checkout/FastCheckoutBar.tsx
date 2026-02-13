import Link from "next/link";
import { CHECKOUT_COPY } from "@/lib/checkoutData";

export default function FastCheckoutBar() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {CHECKOUT_COPY.fastKicker}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            {CHECKOUT_COPY.buttons.signIn}
          </Link>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Continuar com PayPal (demo)"
          >
            PAYPAL
          </button>
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">
          {CHECKOUT_COPY.fastHint}
        </p>
      </div>
    </div>
  );
}
