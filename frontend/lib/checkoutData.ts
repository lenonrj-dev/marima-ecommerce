export type ShippingMethod = {
  id: string;
  label: string;
  eta: string;
  priceCents: number;
};

export type CheckoutFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zip: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
};

export const CHECKOUT_COPY = {
  title: "Finalizar compra",
  fastKicker: "Compra rápida e segura",
  fastHint:
    "Ao continuar, você confirma que leu e concorda com nossos Termos e com a Política de Privacidade.",
  steps: {
    shipping: "Entrega",
    payment: "Pagamento",
    summary: "Resumo",
  },
  sections: {
    shipping: "Dados de entrega",
    contact: "Contato",
    method: "Método de frete",
    billing: "Observações",
  },
  buttons: {
    signIn: "Entrar",
    continue: "Continuar para pagamento",
    placeOrder: "Finalizar compra",
    apply: "Aplicar cupom",
  },
  aside: {
    promoTitle: "Cupom",
    promoPlaceholder: "Digite seu cupom",
    totals: {
      savings: "Desconto",
      subtotal: "Subtotal",
      shipping: "Frete",
      total: "Total",
    },
    note:
      "Ao continuar, você será direcionado para concluir o pagamento no ambiente seguro do Mercado Pago.",
  },
};

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "sul-fluminense",
    label: "Envio rápido Sul Fluminense",
    eta: "Prazo estimado: 2 a 7 dias úteis",
    priceCents: 990,
  },
  {
    id: "padrao-br",
    label: "Envio padrão nacional",
    eta: "Prazo estimado: até 30 dias úteis após confirmação",
    priceCents: 1990,
  },
  {
    id: "expresso",
    label: "Envio expresso",
    eta: "Prazo estimado: 1 a 3 dias úteis",
    priceCents: 2990,
  },
];

export const DEFAULT_CHECKOUT_VALUES: CheckoutFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  zip: "",
  state: "",
  city: "",
  neighborhood: "",
  street: "",
  number: "",
  complement: "",
};

export function formatMoneyBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function validateCheckoutForm(values: CheckoutFormValues) {
  const required: Array<keyof CheckoutFormValues> = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "zip",
    "state",
    "city",
    "neighborhood",
    "street",
    "number",
  ];

  const missing = required.filter((field) => values[field].trim().length === 0);
  if (missing.length > 0) {
    return { ok: false as const, missing };
  }

  return { ok: true as const, missing: [] };
}

