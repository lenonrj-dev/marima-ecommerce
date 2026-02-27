export type Money = number; // em centavos (recomendado p/ evitar float)

export type CartItem = { id : string;
  name: string;
  variant: string;
  imageUrl: string;
  unitPrice: Money; // centavos
  qty: number;
  stock: number; // opcional (se vier do backend)
};

export type Recommendation = { id : string;
  name: string;
  imageUrl: string;
  price: Money;
  badge: string;
  description: string;
  compareAtPrice: Money;
};

export type AddressDraft = { fullName : string;
  email: string;
  phone: string;
  zip: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
};

export type PaymentDraft = { method : "card" | "pix" | "wallet" | "installments";
  installments: number;
};

export type CartTotals = { subtotal : Money;
  discount: Money;
  shipping: Money;
  tax: Money;
  total: Money;
};

export type CartAnalyticsEvent =
  | "cart_open"
  | "cart_close"
  | "cart_add"
  | "cart_remove"
  | "cart_qty_change"
  | "cart_apply_coupon"
  | "cart_checkout_start"
  | "cart_save"
  | "cart_share";

export type CartApiHooks = {
  /**
   * Hook para checar estoque no backend.
   * Retorne { ok: true, availableQty: number } quando estiver ok.
   */
  checkStock: (itemId: string, desiredQty: number) => Promise<{ ok: boolean; availableQty: number }>;

  /**
   * Hook para recalcular frete/impostos no backend (opcional).
   * Se não passar, usamos cálculo local.
   */
  quote: (payload: { items : CartItem[];
    coupon: string;
    address: Partial<AddressDraft>;
  }) => Promise<Partial<CartTotals>>;

  /**
   * Hook de checkout (integrar com criação de pedido, pagamento etc.).
   */
  checkout: (payload: { items : CartItem[];
    totals: CartTotals;
    coupon: string;
    address: AddressDraft;
    payment: PaymentDraft;
    consentLgpd: boolean;
    guest: boolean;
  }) => Promise<{ ok: boolean; redirectUrl: string; error: string }>;

  /**
   * Hook de analytics (GA, Meta, etc).
   */
  track: (event: CartAnalyticsEvent, data: Record<string, unknown>) => void;
};
