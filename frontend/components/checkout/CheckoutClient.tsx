"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import CheckoutShell from "@/components/checkout/CheckoutShell";
import CheckoutSteps from "@/components/checkout/CheckoutSteps";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import ShippingMethods from "@/components/checkout/ShippingMethods";
import OrderSummary from "@/components/checkout/OrderSummary";
import PaymentStub from "@/components/checkout/PaymentStub";
import { useCart } from "@/components/cart/CartProvider";
import {
  DEFAULT_CHECKOUT_VALUES,
  SHIPPING_METHODS,
  validateCheckoutForm,
  type CheckoutFormValues,
} from "@/lib/checkoutData";
import { cancelPendingMercadoPagoOrder, startMercadoPagoCheckout } from "@/lib/payments/mercadoPago";

export default function CheckoutClient() {
  const { isHydrated, cartId, coupon, items, totals } = useCart();
  const [values, setValues] = useState<CheckoutFormValues>(DEFAULT_CHECKOUT_VALUES);
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_METHODS[0]?.id ?? "");
  const [paymentState, setPaymentState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const orderId = sessionStorage.getItem("mp_pending_order_id");
    const cancelToken = sessionStorage.getItem("mp_pending_cancel_token");
    if (!orderId || !cancelToken) return;

    setPaymentState("loading");
    setPaymentMessage("Detectamos um pagamento não concluído. Cancelando o pedido pendente...");

    void (async () => {
      try {
        await cancelPendingMercadoPagoOrder(orderId, cancelToken);
        sessionStorage.removeItem("mp_pending_order_id");
        sessionStorage.removeItem("mp_pending_cancel_token");
        setPaymentState("error");
        setPaymentMessage("Pagamento não concluído. Seu pedido anterior foi cancelado para você tentar novamente.");
      } catch {
        setPaymentState("error");
        setPaymentMessage("Não foi possível cancelar o pedido pendente automaticamente. Tente finalizar novamente.");
      }
    })();
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
      setPaymentState("error");
      setPaymentMessage("Seu carrinho está vazio. Adicione produtos antes de continuar.");
      return;
    }

    const validation = validateCheckoutForm(values);
    if (!validation.ok) {
      setPaymentState("error");
      setPaymentMessage("Preencha todos os campos obrigatórios de entrega para continuar.");
      return;
    }

    if (!selectedShipping) {
      setPaymentState("error");
      setPaymentMessage("Selecione um método de frete.");
      return;
    }

    setPaymentState("loading");
    setPaymentMessage("Preparando a finalização da compra...");

    const payload = {
      source: "marima-web-checkout" as const,
      createdAtISO: new Date().toISOString(),
      shippingMethodId: selectedShipping.id,
      cartId: cartId || undefined,
      couponCode: coupon || undefined,
      items: items.map((item) => ({
        id: item.productId,
        slug: item.slug,
        title: item.name,
        variant: item.variant,
        sizeLabel: item.sizeLabel,
        unitPriceCents: item.unitPrice,
        qty: item.qty,
        subtotalCents: item.unitPrice * item.qty,
      })),
      totals: {
        subtotalCents: totals.subtotal,
        discountCents: totals.discount,
        shippingCents: selectedShipping.priceCents,
        taxCents: totals.tax,
        totalCents: Math.max(0, totals.subtotal - totals.discount + totals.tax + selectedShipping.priceCents),
      },
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
    };

    try {
      await startMercadoPagoCheckout(payload);
      setPaymentState("success");
      setPaymentMessage("Redirecionando para o Mercado Pago...");
    } catch {
      setPaymentState("error");
      setPaymentMessage("Não foi possível iniciar o fluxo de pagamento no momento.");
    }
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
            <button
              type="button"
              onClick={handleContinueToPayment}
              className="inline-flex h-12 w-full items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Continuar para pagamento
            </button>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Esta etapa já cria o pedido no backend e prepara o fluxo de pagamento.
            </p>
          </div>

          <PaymentStub state={paymentState} message={paymentMessage} />
        </div>

        <OrderSummary shippingCents={selectedShipping?.priceCents ?? 0} />
      </CheckoutShell>
    </div>
  );
}
