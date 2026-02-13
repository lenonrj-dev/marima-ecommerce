import Link from "next/link";
import { CHECKOUT_COPY } from "@/lib/checkoutData";

export default function CheckoutHeader() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        {CHECKOUT_COPY.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">
          Início
        </Link>
        <span aria-hidden>/</span>
        <Link href="/produtos" className="hover:text-zinc-900">
          Loja
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-zinc-700">Finalizar compra</span>
      </div>

      <div className="h-px w-full bg-zinc-200" aria-hidden />
    </div>
  );
}

