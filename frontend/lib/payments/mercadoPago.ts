import { apiFetch } from "@/lib/api";

export type MercadoPagoCheckoutAddress = {
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

export type MercadoPagoCheckoutRequest = {
  orderId?: string;
  shippingMethodId: string;
  couponCode?: string;
  cashbackUsedCents?: number;
  address: MercadoPagoCheckoutAddress;
};

type CheckoutResponse = {
  data: {
    preferenceId: string;
    orderId: string;
  };
};

export async function createMercadoPagoCheckoutPreference(input: MercadoPagoCheckoutRequest) {
  const response = await apiFetch<CheckoutResponse>("/api/v1/payments/mercadopago/checkout-pro", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function cancelPendingMercadoPagoOrder(orderId: string) {
  await apiFetch<{ data: { ok: true } }>("/api/v1/payments/mercadopago/cancel", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

