"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, initMercadoPago } from "@mercadopago/sdk-react";
import {
  createMercadoPagoCheckoutPreference,
  type MercadoPagoCheckoutAddress,
} from "@/lib/payments/mercadoPago";
import { HttpError } from "@/lib/api";
import { buildLoginUrl } from "@/lib/authSession";

type MercadoPagoWalletBrickProps = {
  orderId?: string;
  shippingMethodId: string;
  couponCode?: string;
  cashbackUsedCents?: number;
  address: MercadoPagoCheckoutAddress;
  onCreated?: (data: { preferenceId: string; orderId: string }) => void;
};

export default function MercadoPagoWalletBrick({
  orderId,
  shippingMethodId,
  couponCode,
  cashbackUsedCents,
  address,
  onCreated,
}: MercadoPagoWalletBrickProps) {
  const router = useRouter();
  const publicKey = (
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ||
    ""
  ).trim();

  const [state, setState] = useState<"idle" | "creating" | "ready" | "error">("idle");
  const [runtimeMessage, setRuntimeMessage] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string>("");
  const missingPublicKey = !publicKey;

  const payload = useMemo(
    () => ({
      orderId,
      shippingMethodId,
      couponCode,
      cashbackUsedCents,
      address,
    }),
    [address, cashbackUsedCents, couponCode, orderId, shippingMethodId],
  );

  useEffect(() => {
    if (!publicKey) return;

    initMercadoPago(publicKey, { locale: "pt-BR" });
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey) return;

    let active = true;

    void (async () => {
      setState("creating");
      setRuntimeMessage("Preparando pagamento...");

      try {
        const response = await createMercadoPagoCheckoutPreference(payload);
        if (!active) return;

        setPreferenceId(response.preferenceId);

        try {
          sessionStorage.setItem("mp_pending_order_id", response.orderId);
        } catch {
          // Ignore session storage errors.
        }

        onCreated?.({ preferenceId: response.preferenceId, orderId: response.orderId });
        setState("ready");
        setRuntimeMessage(null);
      } catch (error) {
        if (!active) return;
        if (error instanceof HttpError && error.status === 401) {
          router.replace(buildLoginUrl("/checkout"));
          return;
        }

        setState("error");
        setRuntimeMessage("Não foi possível preparar o pagamento. Tente novamente em alguns instantes.");
      }
    })();

    return () => {
      active = false;
    };
  }, [onCreated, payload, publicKey, router]);

  const message = missingPublicKey
    ? "Pagamento indisponível. Chave pública do Mercado Pago não configurada."
    : runtimeMessage;

  return (
    <div className="space-y-4">
      {message ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            state === "error" || missingPublicKey
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-zinc-200 bg-zinc-50 text-zinc-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      ) : null}

      <div
        className={`min-h-[72px] rounded-2xl border border-zinc-200 bg-white p-4 ${
          state === "ready" ? "shadow-soft" : ""
        }`}
      >
        {preferenceId ? (
          <Wallet
            initialization={{ preferenceId }}
            onReady={() => {
              setState("ready");
              setRuntimeMessage(null);
            }}
            onError={() => {
              setState("error");
              setRuntimeMessage("Não foi possível carregar o pagamento. Recarregue a página e tente novamente.");
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
