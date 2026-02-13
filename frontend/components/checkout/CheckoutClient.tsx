"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function CheckoutClient() {
  const { isHydrated, coupon, items } = useCart();
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
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleContinueToPayment() {
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
