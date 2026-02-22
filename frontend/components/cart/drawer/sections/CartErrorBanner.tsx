"use client";

import { Info } from "lucide-react";
import { useCart } from "../../CartProvider";

export default function CartErrorBanner() {
  const { error, setError } = useCart();

  if (!error) return null;

  return (
    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4" />
          <p>{error}</p>
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          className="text-rose-700/80 underline underline-offset-4 hover:text-rose-700"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
