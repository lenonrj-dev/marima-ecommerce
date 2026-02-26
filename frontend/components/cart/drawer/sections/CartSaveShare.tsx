"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Link2, Loader2, Save } from "lucide-react";
import { useCart } from "../../CartProvider";

function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function CartSaveShare() {
  const {
    items,
    isCustomer,
    saveCart,
    saveLoading,
    shareCart,
    shareLoading,
    shareUrl,
    shareExpiresAt,
    error,
    setError,
  } = useCart();

  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const absoluteShareUrl = useMemo(() => (shareUrl ? toAbsoluteUrl(shareUrl) : ""), [shareUrl]);

  const canAct = items.length > 0;

  async function copyToClipboard(url: string) {
    if (!url) return false;

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  async function handleSave() {
    setSaveMessage(null);
    setShareMessage(null);
    setError(null);

    const ok = await saveCart();
    if (ok) {
      setSaveMessage("Carrinho salvo na sua conta com sucesso.");
    }
  }

  async function handleShare() {
    setShareMessage(null);
    setSaveMessage(null);
    setError(null);

    const url = await shareCart();
    if (!url) return;

    const absolute = toAbsoluteUrl(url);
    const copied = await copyToClipboard(absolute);

    if (copied) {
      setShareMessage("Link copiado! Compartilhe com quem você quiser.");
      return;
    }

    setShareMessage("Link gerado. Copie manualmente pelo campo abaixo.");
  }

  return (
    <section
      className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
      aria-labelledby="cart-save-share-title"
    >
      <p id="cart-save-share-title" className="text-sm font-semibold leading-tight text-zinc-900">
        Salvar e compartilhar
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!canAct || saveLoading}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold leading-tight text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {saveLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Save className="h-4 w-4 shrink-0" />
          )}
          <span className="min-w-0 break-words">
            {isCustomer ? "Salvar carrinho" : "Entrar para salvar carrinho"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => void handleShare()}
          disabled={!canAct || shareLoading}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-semibold leading-tight text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        >
          {shareLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4 shrink-0" />
          )}
          <span className="min-w-0 break-words">Compartilhar carrinho</span>
        </button>
      </div>

      {saveMessage ? (
        <p
          className="mt-2 inline-flex items-start gap-1 text-xs text-emerald-700 break-words"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="mt-[1px] h-3.5 w-3.5 shrink-0" />
          <span>{saveMessage}</span>
        </p>
      ) : null}

      {shareMessage ? (
        <p className="mt-2 text-xs text-zinc-600 break-words" role="status" aria-live="polite">
          {shareMessage}
        </p>
      ) : null}

      {absoluteShareUrl ? (
        <div className="mt-3 min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <label htmlFor="shared-cart-url" className="text-xs font-semibold text-zinc-700">
            Link do carrinho
          </label>

          <div className="mt-2 grid grid-cols-1 gap-2">
            <input
              id="shared-cart-url"
              readOnly
              value={absoluteShareUrl}
              className="h-10 min-w-0 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            />

            <button
              type="button"
              onClick={() => void copyToClipboard(absoluteShareUrl)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" />
              Copiar
            </button>
          </div>

          {shareExpiresAt ? (
            <p className="mt-2 text-[11px] text-zinc-500 break-words">
              Link válido até {new Date(shareExpiresAt).toLocaleString("pt-BR")}.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-600 break-words">{error}</p> : null}
    </section>
  );
}