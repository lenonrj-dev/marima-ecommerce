"use client";

import { Info } from "lucide-react";
import { useCart } from "../../CartProvider";

export default function CartErrorBanner() {
  const { error, setError } = useCart();

  if (!error) return null;

  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4" />
          <p>{error}</p>
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          className="text-red-700/80 underline underline-offset-4 hover:text-red-700"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
