export type ISODate = string;

export type ProductStatus = "padrao" | "novo" | "destaque" | "oferta";

export type ProductSizeType = "roupas" | "numerico" | "unico" | "custom";

export type ProductSizeRow = {
  label: string;
  stock: number;
  sku?: string;
  active?: boolean;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  groupKey?: string;
  colorName?: string;
  colorHex?: string;
  category: string;
  size?: string;
  sizeType?: ProductSizeType;
  sizes?: ProductSizeRow[];
  stock: number;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  tags: string[];
  status: ProductStatus;
  active: boolean;
  images: string[];
  updatedAt: ISODate;
};

export type OrderStatus = "pendente" | "pago" | "separacao" | "enviado" | "entregue" | "cancelado" | "reembolsado";

export type OrderItem = {
  id: string;
  name: string;
  sku?: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type Order = {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  email: string;
  itemsCount: number;
  total: number;
  status: OrderStatus;
  channel: "Site" | "WhatsApp" | "Instagram" | "Marketplace";
  shippingMethod: string;
  paymentMethod: string;
  createdAt: ISODate;
  items: OrderItem[];
};

export type AbandonedCart = {
  id: string;
  customerName: string;
  email: string;
  itemsCount: number;
  value: number;
  stage: "frio" | "morno" | "quente";
  recovered: boolean;
  lastActivityAt: ISODate;
};

export type Coupon = {
  id: string;
  code: string;
  description: string;
  type: "percent" | "fixed" | "shipping";
  amount: number;
  minSubtotal?: number;
  uses: number;
  maxUses?: number;
  startsAt: ISODate;
  endsAt: ISODate;
  active: boolean;
  createdAt: ISODate;
};

export type CashbackRule = {
  id: string;
  name: string;
  percent: number;
  validDays: number;
  minSubtotal: number;
  maxCashback: number;
  active: boolean;
};

export type CustomerSegment = "vip" | "recorrente" | "novo" | "inativo";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  segment: CustomerSegment;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: ISODate;
  createdAt: ISODate;
  tags: string[];
};

export type TicketStatus = "aberto" | "em_andamento" | "resolvido";

export type SupportTicket = {
  id: string;
  code: string;
  subject: string;
  customerName: string;
  email: string;
  status: TicketStatus;
  priority: "baixa" | "media" | "alta";
  createdAt: ISODate;
};

export type IntegrationKey =
  | "pagamentos"
  | "frete"
  | "email"
  | "whatsapp"
  | "analytics"
  | "pixel";

export type Integration = {
  id: string;
  group: IntegrationKey;
  name: string;
  description: string;
  connected: boolean;
};

export type DailySeriesPoint = {
  date: ISODate;
  value: number;
};

export type OverviewMetrics = {
  revenue: number;
  orders: number;
  customers: number;
  conversionRate: number; // 0-1
  avgOrderValue: number;
  clicks: number;
  emailsSent: number;
  lowStock: number;
};

export type DeviceBreakdown = { label: string; opened: number; clicks: number };
export type ChannelBreakdown = { label: string; value: number };

export type EmailCampaignRow = {
  id: string;
  name: string;
  publishDate: ISODate;
  sent: number;
  ctr: number; // 0-1
  deliveredRate: number; // 0-1
  unsubscribeRate: number; // 0-1
  spamRate: number; // 0-1
};
