import { apiFetch } from "@/lib/api";

export type OrderPayloadItem = {
  id: string;
  slug: string;
  title: string;
  variant?: string;
  sizeLabel?: string;
  unitPriceCents: number;
  qty: number;
  subtotalCents: number;
};

export type OrderPayloadAddress = {
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

export type OrderPayload = {
  source: "marima-web-checkout";
  createdAtISO: string;
  shippingMethodId: string;
  paymentMethod?: string;
  couponCode?: string;
  cashbackUsedCents?: number;
  cartId?: string;
  items: OrderPayloadItem[];
  totals: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
  };
  address: OrderPayloadAddress;
};

export async function startMercadoPagoCheckout(orderPayload: OrderPayload) {
  const response = await apiFetch<{
    data: { initPoint: string; preferenceId: string; orderId: string; cancelToken: string };
  }>("/api/v1/payments/mercadopago/checkout-pro", {
    method: "POST",
    body: JSON.stringify({
      couponCode: orderPayload.couponCode,
      cashbackUsedCents: orderPayload.cashbackUsedCents,
      address: orderPayload.address,
      shippingMethodId: orderPayload.shippingMethodId,
    }),
  });

  if (typeof window !== "undefined") {
    sessionStorage.setItem("mp_pending_order_id", response.data.orderId);
    sessionStorage.setItem("mp_pending_cancel_token", response.data.cancelToken);
    window.location.href = response.data.initPoint;
  }

  return { ok: true as const };
}

export async function cancelPendingMercadoPagoOrder(orderId: string, cancelToken: string) {
  await apiFetch<{ data: { ok: true } }>("/api/v1/payments/mercadopago/cancel", {
    method: "POST",
    body: JSON.stringify({ orderId, cancelToken }),
  });
}
