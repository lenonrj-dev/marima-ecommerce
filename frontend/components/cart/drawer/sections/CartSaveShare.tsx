"use client";

import { useMemo, useState } from "react";
import { Copy, Link2, Save } from "lucide-react";
import { useCart } from "../../CartProvider";

export default function CartSaveShare() {
  const { items } = useCart();
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const payload = encodeURIComponent(JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty }))));
    return `/cart?share=${payload}`;
  }, [items]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-900">Salvar e compartilhar</p>

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={() => {
            // Placeholder: integração com backend para persistir carrinho do usuário.
            // Ex: POST /api/cart/save
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <Save className="h-4 w-4" />
          Salvar carrinho
        </button>

        <button
          type="button"
          onClick={copy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          <Link2 className="h-4 w-4" />
          {copied ? "Link copiado!" : "Compartilhar carrinho"}
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-500">Integração futura: link curto e carrinho persistido por usuário.</p>
    </div>
  );
}
