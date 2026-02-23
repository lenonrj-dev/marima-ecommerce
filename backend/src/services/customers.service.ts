import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents, toCents } from "../utils/money";
import { invalidateMeCacheForUser } from "./auth.service";

function toCustomer(customer: any) {
  return {
    id: String(customer.id),
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    segment: customer.segment,
    ordersCount: customer.ordersCount,
    totalSpent: fromCents(customer.totalSpentCents),
    lastOrderAt: customer.lastOrderAt ? customer.lastOrderAt.toISOString() : undefined,
    createdAt: customer.createdAt?.toISOString(),
    tags: Array.isArray(customer.tags) ? customer.tags : [],
  };
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
  };
}

function toAddress(address: any) {
  return {
    id: String(address.id),
    label: address.label,
    fullName: address.fullName,
    zip: address.zip,
    state: address.state,
    city: address.city,
    neighborhood: address.neighborhood,
    street: address.street,
    number: address.number,
    complement: address.complement,
    isDefault: address.isDefault,
    createdAt: address.createdAt?.toISOString(),
    updatedAt: address.updatedAt?.toISOString(),
  };
}

function toFavorite(favorite: any) {
  return {
    id: String(favorite.id),
    productId: String(favorite.productId),
    slug: favorite.slug,
    title: favorite.title,
    image: favorite.image,
    price: fromCents(favorite.priceCents),
    createdAt: favorite.createdAt?.toISOString(),
  };
}

export async function listAdminCustomers(input: {
  page: number;
  limit: number;
  q?: string;
  segment?: string;
}) {
  const where: any = {};

  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { email: { contains: input.q, mode: "insensitive" } },
      { phone: { contains: input.q, mode: "insensitive" } },
    ];
  }

  if (input.segment && input.segment !== "all") where.segment = input.segment;

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: rows.map(toCustomer),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getAdminCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");
  return toCustomer(customer);
}

export async function updateAdminCustomer(id: string, input: { segment?: string; tags?: string[]; phone?: string }) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(input.segment !== undefined ? { segment: input.segment as any } : {}),
      ...(input.tags !== undefined ? { tags: input.tags as any } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
    },
  });

  await invalidateMeCacheForUser(updated.id);
  return toCustomer(updated);
}

export async function listAdminCustomerOrders(customerId: string) {
  const rows = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function getMeProfile(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");
  return toCustomer(customer);
}

export async function patchMeProfile(customerId: string, input: { name?: string; phone?: string }) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
    },
  });

  await invalidateMeCacheForUser(updated.id);
  return toCustomer(updated);
}

export async function listMeAddresses(customerId: string) {
  const rows = await prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toAddress);
}

export async function createMeAddress(
  customerId: string,
  input: {
    label: string;
    fullName: string;
    zip: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    complement?: string;
    isDefault?: boolean;
  },
) {
  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false },
    });
  }

  const created = await prisma.customerAddress.create({
    data: {
      ...input,
      customerId,
    },
  });

  return toAddress(created);
}

export async function updateMeAddress(
  customerId: string,
  addressId: string,
  input: Partial<{
    label: string;
    fullName: string;
    zip: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    complement?: string;
    isDefault?: boolean;
  }>,
) {
  const address = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId },
  });
  if (!address) throw new ApiError(404, "Endereço não encontrado.");

  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.customerAddress.update({
    where: { id: address.id },
    data: input,
  });

  return toAddress(updated);
}

export async function deleteMeAddress(customerId: string, addressId: string) {
  await prisma.customerAddress.deleteMany({
    where: { id: addressId, customerId },
  });
}

export async function listMeFavorites(customerId: string) {
  const rows = await prisma.favorite.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toFavorite);
}

export async function addMeFavorite(customerId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Produto não encontrado.");

  const row = await prisma.favorite.upsert({
    where: {
      customerId_productId: {
        customerId,
        productId,
      },
    },
    update: {
      slug: product.slug,
      title: product.name,
      image: Array.isArray(product.images) && product.images.length ? String(product.images[0]) : "",
      priceCents: product.priceCents,
    },
    create: {
      customerId,
      productId,
      slug: product.slug,
      title: product.name,
      image: Array.isArray(product.images) && product.images.length ? String(product.images[0]) : "",
      priceCents: product.priceCents,
    },
  });

  return toFavorite(row);
}

export async function removeMeFavorite(customerId: string, productId: string) {
  await prisma.favorite.deleteMany({
    where: { customerId, productId },
  });
}

export async function refreshCustomerMetrics(customerId: string) {
  const [ordersCount, totals] = await Promise.all([
    prisma.order.count({ where: { customerId } }),
    prisma.order.aggregate({
      where: {
        customerId,
        status: { in: ["pago", "separacao", "enviado", "entregue"] },
      },
      _sum: { totalCents: true },
      _max: { createdAt: true },
    }),
  ]);

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      ordersCount,
      totalSpentCents: totals._sum.totalCents || 0,
      lastOrderAt: totals._max.createdAt || null,
      segment: ordersCount >= 6 ? "vip" : ordersCount >= 2 ? "recorrente" : "novo",
    },
  });
}

export async function getMeCashbackBalance(customerId: string) {
  const row = await prisma.cashbackLedger.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { balanceAfterCents: true },
  });

  const balance = row?.balanceAfterCents || 0;

  return {
    balance: fromCents(balance),
    balanceCents: balance,
  };
}

export async function createCustomerFromGuest(input: { name: string; email: string; phone?: string; passwordHash: string }) {
  const created = await prisma.customer.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash: input.passwordHash,
      segment: "novo",
      ordersCount: 0,
      totalSpentCents: toCents(0),
    },
  });
  return created;
}

export { toCustomer, toOrder, toAddress, toFavorite };
