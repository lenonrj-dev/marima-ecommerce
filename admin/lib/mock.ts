import type {
  AbandonedCart,
  CashbackRule,
  ChannelBreakdown,
  Customer,
  DeviceBreakdown,
  EmailCampaignRow,
  Integration,
  Order,
  OverviewMetrics,
  Product,
  ProductStatus,
  SupportTicket,
} from "./types";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function productStatusLabel(s: ProductStatus) {
  if (s === "novo") return "Novo";
  if (s === "destaque") return "Destaque";
  if (s === "oferta") return "Oferta";
  return "Padrão";
}

export function productStatusTone(s: ProductStatus) {
  if (s === "novo") return "info" as const;
  if (s === "destaque") return "success" as const;
  if (s === "oferta") return "warn" as const;
  return "neutral" as const;
}

export function statusLabel(s: Order["status"]) {
  if (s === "pendente") return "Pendente";
  if (s === "pago") return "Pago";
  if (s === "separacao") return "Em separação";
  if (s === "enviado") return "Enviado";
  if (s === "entregue") return "Entregue";
  if (s === "reembolsado") return "Reembolsado";
  return "Cancelado";
}

export function statusTone(s: Order["status"]) {
  if (s === "pago" || s === "entregue") return "success" as const;
  if (s === "pendente" || s === "separacao") return "warn" as const;
  if (s === "enviado") return "info" as const;
  if (s === "reembolsado" || s === "cancelado") return "danger" as const;
  return "neutral" as const;
}

export const SEED_PRODUCTS: Product[] = [
  {
    id: "p_001",
    name: "Legging Sculpt Seamless",
    sku: "LEG-001",
    category: "fitness",
    size: "P/M/G",
    stock: 18,
    price: 159.9,
    compareAtPrice: 199.9,
    shortDescription: "Modela o corpo com alta compressão e conforto.",
    description:
      "Legging seamless com alta compressão, cintura alta e tecido respirável. Ideal para treinos e uso diário. Não marca e oferece sustentação com toque macio.",
    tags: ["compressão", "cintura alta", "best-seller"],
    status: "destaque",
    active: true,
    images: [
      "https://images.unsplash.com/photo-1520975682031-a8d55b2e9c5e?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1585487000160-6e68b007b6b0?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1520975691375-39f7f5be8e7a?auto=format&fit=crop&w=900&q=60",
    ],
    updatedAt: daysAgo(2),
  },
  {
    id: "p_002",
    name: "Top Active Fit",
    sku: "TOP-014",
    category: "fitness",
    size: "P/M/G",
    stock: 4,
    price: 119.9,
    compareAtPrice: 0,
    shortDescription: "Sustentação média com acabamento premium. ",
    description:
      "Top com sustentação média e tecido de secagem rápida. Recorte anatômico para performance, com alças confortáveis e toque suave.",
    tags: ["secagem rápida", "suporte", "novo"],
    status: "novo",
    active: true,
    images: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1546484959-f9a06fe0f6b8?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1526401485004-2cdd0a4d5b3e?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1526401485004-2cdd0a4d5b3e?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1546484959-f9a06fe0f6b8?auto=format&fit=crop&w=900&q=60",
    ],
    updatedAt: daysAgo(1),
  },
  {
    id: "p_003",
    name: "Camiseta Dry Performance",
    sku: "TEE-210",
    category: "moda",
    size: "P/M/G/GG",
    stock: 52,
    price: 89.9,
    compareAtPrice: 99.9,
    shortDescription: "Leve, respirável e com caimento perfeito. ",
    description:
      "Camiseta dry com tecido leve e respirável. Ideal para treino e casual, com costuras reforçadas e toque gelado.",
    tags: ["dry", "respirável"],
    status: "oferta",
    active: true,
    images: [
      "https://images.unsplash.com/photo-1520975919138-53f93a3f1c9a?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1520975919138-53f93a3f1c9a?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1520975919138-53f93a3f1c9a?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1520975919138-53f93a3f1c9a?auto=format&fit=crop&w=900&q=60",
      "https://images.unsplash.com/photo-1520975919138-53f93a3f1c9a?auto=format&fit=crop&w=900&q=60",
    ],
    updatedAt: daysAgo(5),
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: "o_001",
    code: "10483",
    customerId: "c_001",
    customerName: "Marina Souza",
    email: "marina@email.com",
    itemsCount: 2,
    total: 279.8,
    status: "pago",
    channel: "Site",
    shippingMethod: "PAC",
    paymentMethod: "Pix",
    createdAt: daysAgo(1),
    items: [
      { id: "i_1", name: "Legging Sculpt Seamless", sku: "LEG-001", qty: 1, unitPrice: 159.9, total: 159.9 },
      { id: "i_2", name: "Top Active Fit", sku: "TOP-014", qty: 1, unitPrice: 119.9, total: 119.9 },
    ],
  },
  {
    id: "o_002",
    code: "10470",
    customerId: "c_002",
    customerName: "Bruno Lima",
    email: "bruno@email.com",
    itemsCount: 1,
    total: 89.9,
    status: "enviado",
    channel: "Instagram",
    shippingMethod: "Sedex",
    paymentMethod: "Cartão",
    createdAt: daysAgo(3),
    items: [{ id: "i_3", name: "Camiseta Dry Performance", sku: "TEE-210", qty: 1, unitPrice: 89.9, total: 89.9 }],
  },
  {
    id: "o_003",
    code: "10412",
    customerId: "c_003",
    customerName: "Ana Ribeiro",
    email: "ana@email.com",
    itemsCount: 3,
    total: 399.7,
    status: "pendente",
    channel: "WhatsApp",
    shippingMethod: "Motoboy",
    paymentMethod: "Pix",
    createdAt: daysAgo(6),
    items: [
      { id: "i_4", name: "Legging Sculpt Seamless", sku: "LEG-001", qty: 1, unitPrice: 159.9, total: 159.9 },
      { id: "i_5", name: "Camiseta Dry Performance", sku: "TEE-210", qty: 2, unitPrice: 89.9, total: 179.8 },
      { id: "i_6", name: "Top Active Fit", sku: "TOP-014", qty: 1, unitPrice: 119.9, total: 119.9 },
    ],
  },
];

export const SEED_ABANDONED_CARTS: AbandonedCart[] = [
  {
    id: "ac_001",
    customerName: "Lucas Martins",
    email: "lucas@email.com",
    itemsCount: 2,
    value: 239.8,
    stage: "quente",
    recovered: false,
    lastActivityAt: daysAgo(0),
  },
  {
    id: "ac_002",
    customerName: "Paula Nunes",
    email: "paula@email.com",
    itemsCount: 1,
    value: 159.9,
    stage: "morno",
    recovered: false,
    lastActivityAt: daysAgo(2),
  },
  {
    id: "ac_003",
    customerName: "Igor Santos",
    email: "igor@email.com",
    itemsCount: 1,
    value: 89.9,
    stage: "frio",
    recovered: true,
    lastActivityAt: daysAgo(4),
  },
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "c_001",
    name: "Marina Souza",
    email: "marina@email.com",
    phone: "+55 21 99999-0001",
    segment: "vip",
    ordersCount: 8,
    totalSpent: 1890.5,
    lastOrderAt: daysAgo(1),
    createdAt: daysAgo(120),
    tags: ["vip", "alto valor"],
  },
  {
    id: "c_002",
    name: "Bruno Lima",
    email: "bruno@email.com",
    phone: "+55 11 98888-2211",
    segment: "recorrente",
    ordersCount: 3,
    totalSpent: 540.2,
    lastOrderAt: daysAgo(3),
    createdAt: daysAgo(70),
    tags: ["recorrente"],
  },
  {
    id: "c_003",
    name: "Ana Ribeiro",
    email: "ana@email.com",
    phone: "+55 31 97777-4411",
    segment: "novo",
    ordersCount: 1,
    totalSpent: 399.7,
    lastOrderAt: daysAgo(6),
    createdAt: daysAgo(10),
    tags: ["primeira compra"],
  },
  {
    id: "c_004",
    name: "Rafaela Costa",
    email: "rafa@email.com",
    phone: "+55 48 96666-7788",
    segment: "inativo",
    ordersCount: 2,
    totalSpent: 260.0,
    lastOrderAt: daysAgo(90),
    createdAt: daysAgo(220),
    tags: ["reativar"],
  },
];

export const SEED_COUPONS = [
  {
    id: "cp_001",
    code: "BEMVINDO10",
    description: "10% OFF na primeira compra",
    type: "percent" as const,
    amount: 10,
    minSubtotal: 0,
    uses: 18,
    maxUses: 300,
    startsAt: daysAgo(10),
    endsAt: daysAgo(-20),
    active: true,
    createdAt: daysAgo(10),
  },
  {
    id: "cp_002",
    code: "FRETEGRATIS",
    description: "Frete grátis acima de R$199",
    type: "shipping" as const,
    amount: 0,
    minSubtotal: 199,
    uses: 42,
    maxUses: 500,
    startsAt: daysAgo(20),
    endsAt: daysAgo(-10),
    active: true,
    createdAt: daysAgo(20),
  },
];

export const SEED_CASHBACK_RULES: CashbackRule[] = [
  {
    id: "cb_001",
    name: "Cashback padrão",
    percent: 5,
    validDays: 30,
    minSubtotal: 150,
    maxCashback: 50,
    active: true,
  },
  {
    id: "cb_002",
    name: "VIP (alto valor)",
    percent: 8,
    validDays: 45,
    minSubtotal: 300,
    maxCashback: 120,
    active: false,
  },
];

export const SEED_INTEGRATIONS: Integration[] = [
  {
    id: "in_001",
    group: "pagamentos",
    name: "Pix + Cartão",
    description: "Conecte gateway para Pix, cartão e boleto.",
    connected: false,
  },
  {
    id: "in_002",
    group: "frete",
    name: "Correios / Melhor Envio",
    description: "Cálculo de frete e geração de etiqueta.",
    connected: false,
  },
  {
    id: "in_003",
    group: "email",
    name: "E-mail Marketing",
    description: "Automação para carrinhos abandonados e pós-compra.",
    connected: false,
  },
  {
    id: "in_004",
    group: "whatsapp",
    name: "WhatsApp",
    description: "Recuperação, suporte e campanhas via WhatsApp.",
    connected: false,
  },
  {
    id: "in_005",
    group: "analytics",
    name: "Google Analytics",
    description: "Métricas de tráfego, funil e conversão.",
    connected: false,
  },
  {
    id: "in_006",
    group: "pixel",
    name: "Meta Pixel",
    description: "Atribuição de campanhas e eventos de compra.",
    connected: false,
  },
];

export const SEED_TICKETS: SupportTicket[] = [
  {
    id: "t_001",
    code: "S-2190",
    subject: "Troca de tamanho",
    customerName: "Rafaela Costa",
    email: "rafa@email.com",
    status: "aberto",
    priority: "media",
    createdAt: daysAgo(0),
  },
  {
    id: "t_002",
    code: "S-2187",
    subject: "Prazo de entrega",
    customerName: "Bruno Lima",
    email: "bruno@email.com",
    status: "em_andamento",
    priority: "baixa",
    createdAt: daysAgo(2),
  },
  {
    id: "t_003",
    code: "S-2181",
    subject: "Reembolso",
    customerName: "Marina Souza",
    email: "marina@email.com",
    status: "resolvido",
    priority: "alta",
    createdAt: daysAgo(6),
  },
];

export const SEED_OVERVIEW: OverviewMetrics = {
  revenue: 48210.45,
  orders: 324,
  customers: 118,
  conversionRate: 0.032,
  avgOrderValue: 148.8,
  clicks: 12840,
  emailsSent: 1181,
  lowStock: SEED_PRODUCTS.filter((p) => p.stock <= 5).length,
};

export const SEED_DEVICE: DeviceBreakdown[] = [
  { label: "Smartphone", opened: 860, clicks: 320 },
  { label: "Desktop/Laptop", opened: 260, clicks: 180 },
  { label: "Tablet", opened: 42, clicks: 22 },
  { label: "Smartwatch", opened: 9, clicks: 2 },
  { label: "Outros", opened: 10, clicks: 4 },
];

export const SEED_CHANNELS: ChannelBreakdown[] = [
  { label: "Orgânico", value: 42 },
  { label: "Pago", value: 35 },
  { label: "E-mail", value: 13 },
  { label: "Social", value: 10 },
];

export const SEED_REVENUE_SERIES = Array.from({ length: 14 }).map((_, idx) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - idx));
  const base = 2200;
  const wave = Math.sin(idx / 2) * 420;
  const noise = (idx % 3) * 120;
  return { date: d.toISOString(), value: Math.max(900, base + wave + noise) };
});

export const SEED_EMAIL_CAMPAIGNS: EmailCampaignRow[] = [
  {
    id: "em_001",
    name: "Carrinho abandonado (D0)",
    publishDate: daysAgo(7),
    sent: 12,
    ctr: 0.0538,
    deliveredRate: 1,
    unsubscribeRate: 0.0087,
    spamRate: 0.0107,
  },
  {
    id: "em_002",
    name: "Lançamento: Top Active Fit",
    publishDate: daysAgo(9),
    sent: 9,
    ctr: 0.0715,
    deliveredRate: 1,
    unsubscribeRate: 0.0099,
    spamRate: 0,
  },
  {
    id: "em_003",
    name: "Oferta: Camiseta Dry",
    publishDate: daysAgo(12),
    sent: 7,
    ctr: 0.035,
    deliveredRate: 1,
    unsubscribeRate: 0.002,
    spamRate: 0.0143,
  },
];
