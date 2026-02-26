import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents } from "../utils/money";
import { validateCoupon, registerCouponRedemption } from "./coupons.service";
import { grantCashbackForOrder } from "./cashback.service";
import { refreshCustomerMetrics } from "./customers.service";
import { markCartConverted } from "./carts.service";
import { bumpProductsListVersion, invalidateProductCacheByIdentity } from "./products.service";

type OrderStatus = "pendente" | "pago" | "separacao" | "enviado" | "entregue" | "cancelado" | "reembolsado";

type SizeRow = { label: string; stock: number; active?: boolean };

function normalizeSizes(value: unknown): SizeRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as any;
      const label = String(row.label || "").trim();
      if (!label) return null;
      return {
        label,
        stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
        active: row.active === undefined ? true : Boolean(row.active),
      } as SizeRow;
    })
    .filter((row): row is SizeRow => row !== null);
}

function toOrder(order: any) {
  const items = Array.isArray(order.items) ? order.items : [];

  return {
    id: String(order.id),
    code: order.code,
    customerId: order.customerId ? String(order.customerId) : undefined,
    customerName: order.customerName,
    email: order.email,
    itemsCount: order.itemsCount,
    total: fromCents(order.totalCents),
    status: order.status,
    channel: order.channel,
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt?.toISOString(),
    items: items.map((item: any, index: number) => ({
      id: String(item?.id || item?._id || `${index}`),
      name: item?.name,
      sku: item?.sku,
      qty: Number(item?.qty || 0),
      unitPrice: fromCents(Number(item?.unitPriceCents || 0)),
      total: fromCents(Number(item?.totalCents || 0)),
    })),
    totals: {
      subtotal: fromCents(order.subtotalCents),
      discount: fromCents(order.discountCents),
      shipping: fromCents(order.shippingCents),
      tax: fromCents(order.taxCents),
      total: fromCents(order.totalCents),
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
    },
    address: {
      fullName: order.address?.fullName,
      email: order.address?.email,
      phone: order.address?.phone,
      zip: order.address?.zip,
      state: order.address?.state,
      city: order.address?.city,
      neighborhood: order.address?.neighborhood,
      street: order.address?.street,
      number: order.address?.number,
      complement: order.address?.complement,
    },
  };
}

async function nextOrderCode() {
  const count = await prisma.order.count();
  return String(10000 + count + 1);
}

const FREE_SHIPPING_THRESHOLD_CENTS = 29900;

const SHIPPING_METHODS: Record<string, { id: string; label: string; priceCents: number }> = {
  "sul-fluminense": {
    id: "sul-fluminense",
    label: "Envio rápido Sul Fluminense",
    priceCents: 990,
  },
  "padrao-br": {
    id: "padrao-br",
    label: "Envio padrão nacional",
    priceCents: 1990,
  },
  expresso: {
    id: "expresso",
    label: "Envio expresso",
    priceCents: 2990,
  },
};

function resolveShippingMethod(raw?: string) {
  const input = String(raw || "").trim();
  if (!input) return null;

  const byId = SHIPPING_METHODS[input];
  if (byId) return byId;

  const normalized = input.toLocaleLowerCase("pt-BR");
  const byLabel = Object.values(SHIPPING_METHODS).find(
    (method) => method.label.toLocaleLowerCase("pt-BR") === normalized,
  );

  return byLabel || null;
}

export async function listAdminOrders(input: {
  page: number;
  limit: number;
  q?: string;
  status?: string;
}) {
  const where: any = {};

  if (input.q) {
    where.OR = [
      { code: { contains: input.q, mode: "insensitive" } },
      { customerName: { contains: input.q, mode: "insensitive" } },
      { email: { contains: input.q, mode: "insensitive" } },
    ];
  }

  if (input.status && input.status !== "all") where.status = input.status;

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: rows.map(toOrder),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getAdminOrderById(id: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Pedido não encontrado.");
  return toOrder(order);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Pedido não encontrado.");

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return toOrder(updated);
}

export async function listMeOrders(customerId: string, input: { page: number; limit: number }) {
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.order.count({ where: { customerId } }),
  ]);

  return {
    data: rows.map(toOrder),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getMeOrderById(customerId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, customerId } });
  if (!order) throw new ApiError(404, "Pedido não encontrado.");
  return toOrder(order);
}

export async function createStoreOrder(input: {
  customerId?: string;
  cartId?: string;
  channel?: "Site" | "WhatsApp" | "Instagram" | "Marketplace";
  shippingMethod?: string;
  paymentMethod?: string;
  couponCode?: string;
  cashbackUsedCents?: number;
  finalize?: boolean;
  items: Array<{ id: string; qty: number; variant?: string; sizeLabel?: string }>;
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
}) {
  if (!input.items.length) throw new ApiError(400, "Pedido sem itens.");

  const finalize = input.finalize ?? true;

  const productIds = Array.from(new Set(input.items.map((item) => item.id)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  if (products.length !== productIds.length) {
    throw new ApiError(400, "Um ou mais produtos do pedido não foram encontrados.");
  }

  const productMap = new Map(products.map((p) => [p.id, p] as const));
  const mutableStock = new Map<string, { stock: number; sizes: SizeRow[]; sizeType: string }>();
  for (const p of products) {
    mutableStock.set(p.id, {
      stock: Math.max(0, Math.floor(Number(p.stock ?? 0))),
      sizes: normalizeSizes(p.sizes),
      sizeType: (p.sizeType as string) || "unico",
    });
  }

  const itemRows: any[] = [];

  for (const requested of input.items) {
    const product = productMap.get(requested.id);
    if (!product) throw new ApiError(400, "Produto inválido no pedido.");

    const qty = Math.max(1, Math.floor(requested.qty));
    const stockState = mutableStock.get(product.id)!;
    const hasSizes = stockState.sizeType !== "unico" && stockState.sizes.length > 0;

    let sizeLabel: string | undefined;
    let availableStock = stockState.stock;

    if (hasSizes) {
      const rawLabel = String(requested.sizeLabel || "").trim();
      if (!rawLabel) {
        throw new ApiError(400, `Selecione um tamanho para ${product.name}.`);
      }

      const normalized = rawLabel.toLocaleLowerCase("pt-BR");
      const idx = stockState.sizes.findIndex((entry) => {
        const label = String(entry?.label || "").trim();
        const active = entry?.active === undefined ? true : Boolean(entry.active);
        return active && label.toLocaleLowerCase("pt-BR") === normalized;
      });

      if (idx === -1) throw new ApiError(400, `Tamanho inválido para ${product.name}.`);

      sizeLabel = String(stockState.sizes[idx]!.label || rawLabel).trim();
      availableStock = Math.max(0, Math.floor(Number(stockState.sizes[idx]?.stock ?? 0)));

      if (availableStock < qty) {
        throw new ApiError(400, `Estoque insuficiente para ${product.name} (${sizeLabel}).`);
      }

      stockState.sizes[idx] = {
        ...stockState.sizes[idx]!,
        stock: availableStock - qty,
      };
      stockState.stock = stockState.sizes.reduce((acc, entry) => {
        const isActive = entry.active === undefined ? true : Boolean(entry.active);
        return acc + (isActive ? Math.max(0, entry.stock) : 0);
      }, 0);
    } else {
      if (stockState.stock < qty) {
        throw new ApiError(400, `Estoque insuficiente para ${product.name}.`);
      }
      stockState.stock -= qty;
    }

    const totalCents = product.priceCents * qty;

    itemRows.push({
      product,
      payload: {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        qty,
        unitPriceCents: product.priceCents,
        totalCents,
        variant: requested.variant,
        sizeLabel,
        slug: product.slug,
      },
    });
  }

  const subtotalCents = itemRows.reduce((acc, row) => acc + row.payload.totalCents, 0);
  let discountCents = 0;

  if (input.couponCode) {
    const validation = await validateCoupon(input.couponCode, subtotalCents);
    discountCents = validation.discountCents;
  }

  const shippingMethod = resolveShippingMethod(input.shippingMethod);
  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : shippingMethod?.priceCents ?? 990;
  const taxable = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxable * 0.08);
  const totalCents = taxable + shippingCents + taxCents;

  const code = await nextOrderCode();

  const touchedProducts = new Map<string, string>();

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        code,
        customerId: input.customerId || null,
        customerName: input.address.fullName,
        email: input.address.email.toLowerCase(),
        status: "pendente",
        channel: input.channel || "Site",
        shippingMethod: shippingMethod?.label || input.shippingMethod || "Padrão",
        paymentMethod: input.paymentMethod || "Pix",
        items: itemRows.map((row) => row.payload) as any,
        itemsCount: itemRows.reduce((acc, row) => acc + row.payload.qty, 0),
        subtotalCents,
        discountCents,
        shippingCents,
        taxCents,
        totalCents,
        couponCode: input.couponCode?.toUpperCase(),
        cashbackUsedCents: input.cashbackUsedCents || 0,
        address: input.address as any,
        orderItems: {
          create: itemRows.map((row) => ({
            productId: row.product.id,
            name: row.payload.name,
            sku: row.payload.sku,
            qty: row.payload.qty,
            unitPriceCents: row.payload.unitPriceCents,
            totalCents: row.payload.totalCents,
            variant: row.payload.variant,
            sizeLabel: row.payload.sizeLabel,
            slug: row.payload.slug,
          })),
        },
      },
    });

    for (const row of itemRows) {
      const stockState = mutableStock.get(row.product.id)!;
      await tx.product.update({
        where: { id: row.product.id },
        data: {
          stock: stockState.stock,
          sizes: stockState.sizes as any,
        },
      });

      touchedProducts.set(row.product.id, String(row.product.slug || ""));

      await tx.inventoryMovement.create({
        data: {
          productId: row.product.id,
          type: "saida",
          quantity: -Math.max(1, Math.floor(Number(row.payload.qty))),
          reason: `Pedido ${code}`,
          createdBy: input.customerId || "sistema",
          sizeLabel: row.payload.sizeLabel,
        },
      });
    }

    return order;
  });

  if (touchedProducts.size > 0) {
    await Promise.all(
      Array.from(touchedProducts.entries()).map(([id, slug]) =>
        invalidateProductCacheByIdentity({
          id,
          slug,
          bumpListVersion: false,
        }),
      ),
    );
    await bumpProductsListVersion();
  }

  if (finalize) {
    if (input.couponCode && discountCents > 0) {
      await registerCouponRedemption({
        couponCode: input.couponCode,
        orderId: String(created.id),
        customerId: input.customerId,
        discountCents,
      });
    }

    const cashback = await grantCashbackForOrder({
      customerId: input.customerId,
      orderId: String(created.id),
      subtotalCents,
    });

    if (cashback.grantedCents > 0) {
      await prisma.order.update({
        where: { id: created.id },
        data: { cashbackGrantedCents: cashback.grantedCents },
      });
    }

    if (input.customerId) {
      await refreshCustomerMetrics(input.customerId);
    }

    if (input.cartId) {
      await markCartConverted(input.cartId);
    }
  }

  const fresh = await prisma.order.findUnique({ where: { id: created.id } });
  if (!fresh) throw new ApiError(500, "Falha ao carregar pedido criado.");
  return toOrder(fresh);
}

export async function createOrderFromCart(cartId: string) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) throw new ApiError(404, "Carrinho não encontrado.");

  const items = Array.isArray(cart.items) ? cart.items : [];
  if (!items.length) throw new ApiError(400, "Carrinho sem itens.");

  const order = await createStoreOrder({
    customerId: cart.customerId || undefined,
    cartId: String(cart.id),
    channel: "Site",
    shippingMethod: "Padrão",
    paymentMethod: "Pix",
    couponCode: cart.couponCode || undefined,
    items: items.map((item: any) => ({
      id: String(item.productId),
      qty: Number(item.qty || 1),
      variant: item.variant,
      sizeLabel: item.sizeLabel,
    })),
    address: {
      fullName: "Cliente",
      email: "cliente@exemplo.com",
      phone: "",
      zip: "",
      state: "",
      city: "",
      neighborhood: "",
      street: "",
      number: "",
      complement: "",
    },
  });

  return order;
}

export { toOrder };

