"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import CheckoutShell from "@/components/checkout/CheckoutShell";
import CheckoutSteps from "@/components/checkout/CheckoutSteps";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import ShippingMethods from "@/components/checkout/ShippingMethods";
import OrderSummary from "@/components/checkout/OrderSummary";
import { useCart } from "@/components/cart/CartProvider";
import {
  DEFAULT_CHECKOUT_VALUES,
  SHIPPING_METHODS,
  validateCheckoutForm,
  type CheckoutFormValues,
} from "@/lib/checkoutData";
import MercadoPagoWalletBrick from "@/components/checkout/MercadoPagoWalletBrick";
import { cancelPendingMercadoPagoOrder } from "@/lib/payments/mercadoPago";
import { buildLoginUrl, isAuthenticated } from "@/lib/authSession";
import { apiFetch } from "@/lib/api";
import type { DashboardAddress } from "@/lib/dashboardData";

const CHECKOUT_ADDRESS_PROMPT_SESSION_KEY = "marima:checkout:saved-address-prompt:v1";

type AddressPromptDecision = "accepted" | "declined";

function pickPreferredAddress(addresses: DashboardAddress[]) {
  if (!Array.isArray(addresses) || addresses.length === 0) return null;
  return addresses.find((address) => Boolean(address.isDefault)) || addresses[0] || null;
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function readAddressPromptDecision(): AddressPromptDecision | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_ADDRESS_PROMPT_SESSION_KEY);
    if (raw === "accepted" || raw === "declined") return raw;
  } catch {
    // Ignore sessionStorage failures.
  }

  return null;
}

function saveAddressPromptDecision(decision: AddressPromptDecision) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHECKOUT_ADDRESS_PROMPT_SESSION_KEY, decision);
  } catch {
    // Ignore sessionStorage failures.
  }
}

export default function CheckoutClient() {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrated, coupon, items } = useCart();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [values, setValues] = useState<CheckoutFormValues>(DEFAULT_CHECKOUT_VALUES);
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_METHODS[0]?.id ?? "");
  const [paymentInput, setPaymentInput] = useState<{
    shippingMethodId: string;
    couponCode?: string;
    address: {
      fullName: string;
      email: string;
      phone: string;
      zip: string;
      state: string;
      city: string;
      neighborhood: string;
      street: string;
      number: string;
      complement?: string;
    };
  } | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [savedAddressPrompt, setSavedAddressPrompt] = useState<{
    open: boolean;
    address: DashboardAddress | null;
  }>({
    open: false,
    address: null,
  });
  const [addressToastMessage, setAddressToastMessage] = useState<string | null>(null);
  const nextPath = pathname || "/checkout";
  const [hasManualAddressInput, setHasManualAddressInput] = useState(false);

  const hasAnyCheckoutAddressValue = useMemo(() => {
    return (
      values.firstName.trim().length > 0 ||
      values.lastName.trim().length > 0 ||
      values.phone.trim().length > 0 ||
      values.zip.trim().length > 0 ||
      values.state.trim().length > 0 ||
      values.city.trim().length > 0 ||
      values.neighborhood.trim().length > 0 ||
      values.street.trim().length > 0 ||
      values.number.trim().length > 0 ||
      values.complement.trim().length > 0
    );
  }, [values]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const authed = await isAuthenticated();
      if (!active) return;

      if (!authed) {
        router.replace(buildLoginUrl(nextPath || "/checkout"));
        return;
      }

      setIsAuthed(true);
      setAuthChecked(true);
    })();

    return () => {
      active = false;
    };
  }, [nextPath, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelling = false;

    async function cancelPendingIfNeeded() {
      if (cancelling) return;
      const orderId = sessionStorage.getItem("mp_pending_order_id");
      if (!orderId) return;
      cancelling = true;

      try {
        setPaymentMessage("Detectamos um pagamento não concluído. Cancelando o pedido pendente...");
        await cancelPendingMercadoPagoOrder(orderId);
        sessionStorage.removeItem("mp_pending_order_id");
        setPaymentMessage("Pagamento não concluído. Seu pedido anterior foi cancelado para você tentar novamente.");
      } catch {
        setPaymentMessage("Não foi possível cancelar o pedido pendente automaticamente. Tente finalizar novamente.");
      } finally {
        cancelling = false;
      }
    }

    void cancelPendingIfNeeded();

    const onPageShow = () => {
      void cancelPendingIfNeeded();
    };

    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const selectedShipping = useMemo(
    () => SHIPPING_METHODS.find((method) => method.id === shippingMethod) ?? SHIPPING_METHODS[0],
    [shippingMethod],
  );

  function updateField(field: keyof CheckoutFormValues, value: string) {
    setHasManualAddressInput(true);
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function applySavedAddress(address: DashboardAddress) {
    const { firstName, lastName } = splitFullName(address.fullName || "");

    setValues((previous) => ({
      ...previous,
      firstName: firstName || previous.firstName,
      lastName: lastName || previous.lastName,
      phone: previous.phone,
      zip: address.zip || previous.zip,
      state: address.state || previous.state,
      city: address.city || previous.city,
      neighborhood: address.neighborhood || previous.neighborhood,
      street: address.street || previous.street,
      number: address.number || previous.number,
      complement: address.complement || "",
    }));
  }

  useEffect(() => {
    if (!authChecked || !isAuthed) return;

    const sessionDecision = readAddressPromptDecision();
    if (sessionDecision === "declined") return;

    let active = true;

    void (async () => {
      try {
        const response = await apiFetch<{ data: DashboardAddress[] }>("/api/v1/me/addresses", {
          method: "GET",
          cache: "no-store",
          skipAuthRedirect: true,
        });
        if (!active) return;

        const preferredAddress = pickPreferredAddress(response.data || []);
        if (!preferredAddress) return;

        if (sessionDecision === "accepted") {
          // Respeita edição manual do cliente nesta sessão de checkout.
          if (!hasManualAddressInput && !hasAnyCheckoutAddressValue) {
            applySavedAddress(preferredAddress);
          }
          return;
        }

        setSavedAddressPrompt({
          open: true,
          address: preferredAddress,
        });
      } catch {
        // Sem endereço salvo ou falha pontual: checkout segue normalmente.
      }
    })();

    return () => {
      active = false;
    };
  }, [authChecked, hasAnyCheckoutAddressValue, hasManualAddressInput, isAuthed]);

  useEffect(() => {
    if (!addressToastMessage) return;
    const timeoutId = window.setTimeout(() => {
      setAddressToastMessage(null);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [addressToastMessage]);

  function handleUseSavedAddress() {
    if (!savedAddressPrompt.address) {
      setSavedAddressPrompt({ open: false, address: null });
      return;
    }

    applySavedAddress(savedAddressPrompt.address);
    saveAddressPromptDecision("accepted");
    setSavedAddressPrompt({ open: false, address: null });
    setAddressToastMessage("Endereço salvo aplicado no checkout.");
  }

  function handleManualAddress() {
    saveAddressPromptDecision("declined");
    setSavedAddressPrompt({ open: false, address: null });
    setAddressToastMessage("Tudo certo. Você pode preencher o endereço manualmente.");
  }

  async function handleContinueToPayment() {
    const authed = await isAuthenticated();
    if (!authed) {
      router.push(buildLoginUrl(nextPath || "/checkout"));
      return;
    }

    if (items.length === 0) {
      setPaymentMessage("Seu carrinho está vazio. Adicione produtos antes de continuar.");
      return;
    }

    const validation = validateCheckoutForm(values);
    if (!validation.ok) {
      setPaymentMessage("Preencha todos os campos obrigatórios de entrega para continuar.");
      return;
    }

    if (!selectedShipping) {
      setPaymentMessage("Selecione um método de frete.");
      return;
    }

    setPaymentInput({
      shippingMethodId: selectedShipping.id,
      couponCode: coupon || undefined,
      address: {
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        phone: values.phone,
        zip: values.zip,
        state: values.state,
        city: values.city,
        neighborhood: values.neighborhood,
        street: values.street,
        number: values.number,
        complement: values.complement || undefined,
      },
    });
    setPaymentMessage(null);
  }

  if (!authChecked) {
    return (
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-soft">
          Validando sua sessão...
        </div>
      </section>
    );
  }

  if (!isAuthed) {
    return null;
  }

  if (!isHydrated) {
    return (
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-soft">
          Carregando finalização da compra...
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Seu carrinho está vazio</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Adicione produtos para continuar para a finalização da compra.
          </p>
          <Link
            href="/produtos"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            Voltar para loja
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {savedAddressPrompt.open && savedAddressPrompt.address ? (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Confirmação de endereço salvo"
          className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-[90] w-[min(720px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.14)]"
        >
          <p className="text-sm font-semibold text-zinc-900">Encontramos um endereço salvo</p>
          <p className="mt-1 text-xs text-zinc-600">
            Deseja usar o endereço salvo da sua conta para preencher o checkout?
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUseSavedAddress}
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-xs font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Usar endereço salvo
            </button>
            <button
              type="button"
              onClick={handleManualAddress}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Preencher manualmente
            </button>
          </div>
        </div>
      ) : null}

      {addressToastMessage ? (
        <div className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-[89] w-[min(560px,calc(100%-32px))] -translate-x-1/2 rounded-xl border border-zinc-200 bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
          {addressToastMessage}
        </div>
      ) : null}

      <div className="bg-white">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <CheckoutHeader />
        </div>
      </div>

      <CheckoutShell>
        <div className="space-y-6">
          <CheckoutSteps active="payment" />
          <CheckoutForm values={values} onChange={updateField} />
          <ShippingMethods methods={SHIPPING_METHODS} value={shippingMethod} onChange={setShippingMethod} />

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
            {paymentInput ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Pagamento</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Escolha uma opção no Mercado Pago para continuar com segurança.
                  </p>
                </div>

                <MercadoPagoWalletBrick
                  shippingMethodId={paymentInput.shippingMethodId}
                  couponCode={paymentInput.couponCode}
                  address={paymentInput.address}
                />

                <button
                  type="button"
                  onClick={() => setPaymentInput(null)}
                  className="inline-flex text-xs font-semibold text-zinc-700 underline underline-offset-4 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  Alterar dados de entrega
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  className="inline-flex h-12 w-full items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  Continuar para pagamento
                </button>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Esta etapa cria o pedido no backend e gera a preferência do Mercado Pago.
                </p>
              </div>
            )}
          </div>

          {paymentMessage ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700" role="status" aria-live="polite">
              {paymentMessage}
            </div>
          ) : null}
        </div>

        <OrderSummary shippingCents={selectedShipping?.priceCents ?? 0} />
      </CheckoutShell>
    </div>
  );
}
