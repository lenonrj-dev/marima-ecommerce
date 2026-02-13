"use client";

import Script from "next/script";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createMercadoPagoCheckoutPreference,
  type MercadoPagoCheckoutAddress,
} from "@/lib/payments/mercadoPago";

type MercadoPagoWalletBrickProps = {
  orderId?: string;
  shippingMethodId: string;
  couponCode?: string;
  cashbackUsedCents?: number;
  address: MercadoPagoCheckoutAddress;
  onCreated?: (data: { preferenceId: string; orderId: string }) => void;
};

type BrickController = { unmount: () => Promise<void> | void };

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          name: "wallet",
          containerId: string,
          settings: {
            initialization: { preferenceId: string };
            callbacks?: {
              onReady?: () => void;
              onError?: (error: unknown) => void;
            };
          },
        ) => Promise<BrickController>;
      };
    };
  }
}

export default function MercadoPagoWalletBrick({
  orderId,
  shippingMethodId,
  couponCode,
  cashbackUsedCents,
  address,
  onCreated,
}: MercadoPagoWalletBrickProps) {
  const publicKey = (
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ||
    ""
  ).trim();
  const reactId = useId();
  const containerId = useMemo(() => `mp_wallet_${reactId.replace(/[:]/g, "_")}`, [reactId]);
  const brickRef = useRef<BrickController | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [state, setState] = useState<"idle" | "creating" | "rendering" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string>("");

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
    if (typeof window !== "undefined" && window.MercadoPago) {
      setSdkReady(true);
    }
  }, []);

  useEffect(() => {
    if (!publicKey) {
      setState("error");
      setMessage("Pagamento indisponível. Chave pública do Mercado Pago não configurada.");
      return;
    }

    let active = true;

    setState("creating");
    setMessage("Preparando pagamento...");

    void (async () => {
      try {
        const response = await createMercadoPagoCheckoutPreference(payload);
        if (!active) return;

        setPreferenceId(response.preferenceId);

        try {
          sessionStorage.setItem("mp_pending_order_id", response.orderId);
        } catch {
          // ignore
        }

        onCreated?.({ preferenceId: response.preferenceId, orderId: response.orderId });

        setState("rendering");
        setMessage("Carregando Mercado Pago...");
      } catch {
        if (!active) return;
        setState("error");
        setMessage("Não foi possível preparar o pagamento. Tente novamente em alguns instantes.");
      }
    })();

    return () => {
      active = false;
    };
  }, [onCreated, payload, publicKey]);

  useEffect(() => {
    if (!sdkReady) return;
    if (!preferenceId) return;
    if (!publicKey) {
      setState("error");
      setMessage("Pagamento indisponível. Chave pública do Mercado Pago não configurada.");
      return;
    }

    let active = true;

    void (async () => {
      try {
        setState("rendering");

        if (brickRef.current) {
          try {
            await brickRef.current.unmount();
          } catch {
            // ignore
          }
          brickRef.current = null;
        }

        const container = document.getElementById(containerId);
        if (container) container.innerHTML = "";

        const MercadoPago = window.MercadoPago;
        if (!MercadoPago) throw new Error("SDK do Mercado Pago não carregado.");

        const mp = new MercadoPago(publicKey, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks();

        const controller = await bricksBuilder.create("wallet", containerId, {
          initialization: { preferenceId },
          callbacks: {
            onReady: () => {
              if (!active) return;
              setState("ready");
              setMessage(null);
            },
            onError: () => {
              if (!active) return;
              setState("error");
              setMessage("Não foi possível carregar o pagamento. Recarregue a página e tente novamente.");
            },
          },
        });

        if (!active) {
          try {
            await controller.unmount();
          } catch {
            // ignore
          }
          return;
        }

        brickRef.current = controller;
      } catch {
        if (!active) return;
        setState("error");
        setMessage("Não foi possível carregar o pagamento. Recarregue a página e tente novamente.");
      }
    })();

    return () => {
      active = false;
      const current = brickRef.current;
      brickRef.current = null;
      if (current) {
        try {
          void current.unmount();
        } catch {
          // ignore
        }
      }
    };
  }, [containerId, preferenceId, publicKey, sdkReady]);

  return (
    <div className="space-y-4">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />

      {message ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            state === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-zinc-200 bg-zinc-50 text-zinc-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      ) : null}

      <div
        id={containerId}
        className={`min-h-[72px] rounded-2xl border border-zinc-200 bg-white p-4 ${
          state === "ready" ? "shadow-soft" : ""
        }`}
      />
    </div>
  );
}
