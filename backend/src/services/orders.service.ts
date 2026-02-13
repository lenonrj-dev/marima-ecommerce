import { FilterQuery, Types } from "mongoose";
import { CartModel } from "../models/Cart";
import { InventoryMovementModel } from "../models/InventoryMovement";
import { OrderModel, OrderStatus } from "../models/Order";
import { ProductModel } from "../models/Product";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents } from "../utils/money";
import { validateCoupon, registerCouponRedemption } from "./coupons.service";
import { grantCashbackForOrder } from "./cashback.service";
import { refreshCustomerMetrics } from "./customers.service";
import { markCartConverted } from "./carts.service";

function toOrder(order: any) {
  return {
    id: String(order._id),
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
    items: (order.items || []).map((item: any) => ({
      id: String(item._id),
      name: item.name,
      sku: item.sku,
      qty: item.qty,
      unitPrice: fromCents(item.unitPriceCents),
      total: fromCents(item.totalCents),
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
      fullName: order.address.fullName,
      email: order.address.email,
      phone: order.address.phone,
      zip: order.address.zip,
      state: order.address.state,
      city: order.address.city,
      neighborhood: order.address.neighborhood,
      street: order.address.street,
      number: order.address.number,
      complement: order.address.complement,
    },
  };
}

async function nextOrderCode() {
  const count = await OrderModel.countDocuments();
  return String(10000 + count + 1);
}

const FREE_SHIPPING_THRESHOLD_CENTS = 29900;

const SHIPPING_METHODS: Record<string, { id: string; label: string; priceCents: number }> = {
  "sul-fluminense": {
    id: "sul-fluminense",
    label: "Envio rápido Sul Fluminense",
    priceCents: 1290,
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
  const query: FilterQuery<any> = {};

  if (input.q) {
    query.$or = [
      { code: { $regex: input.q, $options: "i" } },
      { customerName: { $regex: input.q, $options: "i" } },
      { email: { $regex: input.q, $options: "i" } },
    ];
  }

  if (input.status && input.status !== "all") query.status = input.status;

  const [rows, total] = await Promise.all([
    OrderModel.find(query)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    OrderModel.countDocuments(query),
  ]);

  return {
    data: rows.map(toOrder),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getAdminOrderById(id: string) {
  const order = await OrderModel.findById(id);
  if (!order) throw new ApiError(404, "Pedido não encontrado.");
  return toOrder(order);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await OrderModel.findById(id);
  if (!order) throw new ApiError(404, "Pedido não encontrado.");

  order.status = status;
  await order.save();

  return toOrder(order);
}

export async function listMeOrders(customerId: string, input: { page: number; limit: number }) {
  const [rows, total] = await Promise.all([
    OrderModel.find({ customerId })
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    OrderModel.countDocuments({ customerId }),
  ]);

  return {
    data: rows.map(toOrder),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getMeOrderById(customerId: string, orderId: string) {
  const order = await OrderModel.findOne({ _id: orderId, customerId });
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

  const productIds = input.items.map((item) => item.id);
  const products = await ProductModel.find({ _id: { $in: productIds }, active: true });
  if (products.length !== input.items.length) {
    throw new ApiError(400, "Um ou mais produtos do pedido não foram encontrados.");
  }

  const itemRows: any[] = [];

  for (const requested of input.items) {
    const product = products.find((row) => String(row._id) === requested.id);
    if (!product) throw new ApiError(400, "Produto inválido no pedido.");

    const qty = Math.max(1, Math.floor(requested.qty));

    const sizeType =
      (product.sizeType as string) || (Array.isArray(product.sizes) && product.sizes.length ? "custom" : "unico");
    const hasSizes = sizeType !== "unico" && Array.isArray(product.sizes) && product.sizes.length > 0;

    let sizeLabel: string | undefined;
    let availableStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));

    if (hasSizes) {
      const rawLabel = String(requested.sizeLabel || "").trim();
      if (!rawLabel) {
        throw new ApiError(400, `Selecione um tamanho para ${product.name}.`);
      }

      const normalized = rawLabel.toLocaleLowerCase("pt-BR");
      const row = product.sizes.find((entry: any) => {
        const label = String(entry?.label || "").trim();
        const active = entry?.active === undefined ? true : Boolean(entry.active);
        return active && label.toLocaleLowerCase("pt-BR") === normalized;
      });

      if (!row) throw new ApiError(400, `Tamanho inválido para ${product.name}.`);

      sizeLabel = String(row.label || rawLabel).trim();
      availableStock = Math.max(0, Math.floor(Number(row.stock ?? 0)));
    }

    if (availableStock < qty) {
      throw new ApiError(400, hasSizes ? `Estoque insuficiente para ${product.name} (${sizeLabel}).` : `Estoque insuficiente para ${product.name}.`);
    }

    const totalCents = product.priceCents * qty;

    itemRows.push({
      product,
      payload: {
        productId: product._id,
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
      : shippingMethod?.priceCents ?? 1290;
  const taxable = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxable * 0.08);
  const totalCents = taxable + shippingCents + taxCents;

  const code = await nextOrderCode();

  const created = await OrderModel.create({
    code,
    customerId: input.customerId ? new Types.ObjectId(input.customerId) : undefined,
    customerName: input.address.fullName,
    email: input.address.email.toLowerCase(),
    status: "pendente",
    channel: input.channel || "Site",
    shippingMethod: shippingMethod?.label || input.shippingMethod || "Padrão",
    paymentMethod: input.paymentMethod || "Pix",
    items: itemRows.map((row) => row.payload),
    itemsCount: itemRows.reduce((acc, row) => acc + row.payload.qty, 0),
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents,
    couponCode: input.couponCode?.toUpperCase(),
    cashbackUsedCents: input.cashbackUsedCents || 0,
    address: input.address,
  });

  for (const row of itemRows) {
    const qty = Math.max(1, Math.floor(Number(row.payload.qty)));
    const sizeLabel = row.payload.sizeLabel ? String(row.payload.sizeLabel).trim() : undefined;

    if (sizeLabel && Array.isArray(row.product.sizes) && row.product.sizes.length > 0) {
      const normalized = sizeLabel.toLocaleLowerCase("pt-BR");
      const idx = row.product.sizes.findIndex(
        (entry: any) => String(entry?.label || "").trim().toLocaleLowerCase("pt-BR") === normalized,
      );

      if (idx >= 0) {
        const current = Math.max(0, Math.floor(Number(row.product.sizes[idx]?.stock ?? 0)));
        row.product.sizes[idx]!.stock = Math.max(0, current - qty);
      }

      row.product.stock = row.product.sizes.reduce((acc: number, entry: any) => {
        const isActive = entry?.active === undefined ? true : Boolean(entry.active);
        const value = Math.max(0, Math.floor(Number(entry?.stock ?? 0)));
        return acc + (isActive ? value : 0);
      }, 0);
    } else {
      row.product.stock = Math.max(0, Math.floor(Number(row.product.stock ?? 0)) - qty);
    }

    await row.product.save();

    await InventoryMovementModel.create({
      productId: row.product._id,
      type: "saida",
      quantity: -qty,
      reason: `Pedido ${code}`,
      createdBy: input.customerId || "sistema",
      sizeLabel,
    });
  }

  if (finalize) {
    if (input.couponCode && discountCents > 0) {
      await registerCouponRedemption({
        couponCode: input.couponCode,
        orderId: String(created._id),
        customerId: input.customerId,
        discountCents,
      });
    }

    const cashback = await grantCashbackForOrder({
      customerId: input.customerId,
      orderId: String(created._id),
      subtotalCents,
    });

    if (cashback.grantedCents > 0) {
      created.cashbackGrantedCents = cashback.grantedCents;
      await created.save();
    }

    if (input.customerId) {
      await refreshCustomerMetrics(input.customerId);
    }

    if (input.cartId) {
      await markCartConverted(input.cartId);
    }
  }

  return toOrder(created);
}

export async function createOrderFromCart(cartId: string) {
  const cart = await CartModel.findById(cartId);
  if (!cart) throw new ApiError(404, "Carrinho não encontrado.");
  if (!cart.items.length) throw new ApiError(400, "Carrinho sem itens.");

  const order = await createStoreOrder({
    customerId: cart.customerId ? String(cart.customerId) : undefined,
    cartId: String(cart._id),
    channel: "Site",
    shippingMethod: "Padrão",
    paymentMethod: "Pix",
    couponCode: cart.couponCode,
    items: cart.items.map((item: any) => ({
      id: String(item.productId),
      qty: item.qty,
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
