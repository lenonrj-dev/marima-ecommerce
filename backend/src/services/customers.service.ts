import { FilterQuery, Types } from "mongoose";
import { CustomerAddressModel } from "../models/CustomerAddress";
import { CustomerModel } from "../models/Customer";
import { FavoriteModel } from "../models/Favorite";
import { OrderModel } from "../models/Order";
import { ProductModel } from "../models/Product";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents, toCents } from "../utils/money";

function toCustomer(customer: any) {
  return {
    id: String(customer._id),
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    segment: customer.segment,
    ordersCount: customer.ordersCount,
    totalSpent: fromCents(customer.totalSpentCents),
    lastOrderAt: customer.lastOrderAt ? customer.lastOrderAt.toISOString() : undefined,
    createdAt: customer.createdAt?.toISOString(),
    tags: customer.tags || [],
  };
}

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
  };
}

function toAddress(address: any) {
  return {
    id: String(address._id),
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
    id: String(favorite._id),
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
  const query: FilterQuery<any> = {};

  if (input.q) {
    query.$or = [
      { name: { $regex: input.q, $options: "i" } },
      { email: { $regex: input.q, $options: "i" } },
      { phone: { $regex: input.q, $options: "i" } },
      { tags: { $elemMatch: { $regex: input.q, $options: "i" } } },
    ];
  }

  if (input.segment && input.segment !== "all") query.segment = input.segment;

  const [rows, total] = await Promise.all([
    CustomerModel.find(query)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    CustomerModel.countDocuments(query),
  ]);

  return {
    data: rows.map(toCustomer),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getAdminCustomerById(id: string) {
  const customer = await CustomerModel.findById(id);
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");
  return toCustomer(customer);
}

export async function updateAdminCustomer(id: string, input: { segment?: string; tags?: string[]; phone?: string }) {
  const customer = await CustomerModel.findById(id);
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  if (input.segment) customer.segment = input.segment as any;
  if (input.tags) customer.tags = input.tags;
  if (input.phone !== undefined) customer.phone = input.phone || undefined;

  await customer.save();
  return toCustomer(customer);
}

export async function listAdminCustomerOrders(customerId: string) {
  const rows = await OrderModel.find({ customerId }).sort({ createdAt: -1 });
  return rows.map(toOrder);
}

export async function getMeProfile(customerId: string) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");
  return toCustomer(customer);
}

export async function patchMeProfile(customerId: string, input: { name?: string; phone?: string }) {
  const customer = await CustomerModel.findById(customerId);
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  if (input.name !== undefined) customer.name = input.name.trim();
  if (input.phone !== undefined) customer.phone = input.phone?.trim() || undefined;

  await customer.save();
  return toCustomer(customer);
}

export async function listMeAddresses(customerId: string) {
  const rows = await CustomerAddressModel.find({ customerId }).sort({ isDefault: -1, createdAt: -1 });
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
    await CustomerAddressModel.updateMany({ customerId }, { $set: { isDefault: false } });
  }

  const created = await CustomerAddressModel.create({ ...input, customerId });
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
  const address = await CustomerAddressModel.findOne({ _id: addressId, customerId });
  if (!address) throw new ApiError(404, "Endereço não encontrado.");

  if (input.isDefault) {
    await CustomerAddressModel.updateMany({ customerId }, { $set: { isDefault: false } });
  }

  Object.assign(address, input);
  await address.save();
  return toAddress(address);
}

export async function deleteMeAddress(customerId: string, addressId: string) {
  await CustomerAddressModel.findOneAndDelete({ _id: addressId, customerId });
}

export async function listMeFavorites(customerId: string) {
  const rows = await FavoriteModel.find({ customerId }).sort({ createdAt: -1 });
  return rows.map(toFavorite);
}

export async function addMeFavorite(customerId: string, productId: string) {
  if (!Types.ObjectId.isValid(productId)) throw new ApiError(400, "Produto inválido.");
  const product = await ProductModel.findById(productId);
  if (!product) throw new ApiError(404, "Produto não encontrado.");

  const row = await FavoriteModel.findOneAndUpdate(
    { customerId, productId },
    {
      $setOnInsert: {
        customerId,
        productId,
        slug: product.slug,
        title: product.name,
        image: product.images?.[0] || "",
        priceCents: product.priceCents,
      },
    },
    { upsert: true, new: true },
  );

  return toFavorite(row);
}

export async function removeMeFavorite(customerId: string, productId: string) {
  await FavoriteModel.findOneAndDelete({ customerId, productId });
}

export async function refreshCustomerMetrics(customerId: string) {
  const [ordersCount, total] = await Promise.all([
    OrderModel.countDocuments({ customerId }),
    OrderModel.aggregate([
      { $match: { customerId: new Types.ObjectId(customerId), status: { $in: ["pago", "separacao", "enviado", "entregue"] } } },
      { $group: { _id: null, total: { $sum: "$totalCents" }, lastOrderAt: { $max: "$createdAt" } } },
    ]),
  ]);

  await CustomerModel.findByIdAndUpdate(customerId, {
    $set: {
      ordersCount,
      totalSpentCents: total[0]?.total || 0,
      lastOrderAt: total[0]?.lastOrderAt || null,
      segment: ordersCount >= 6 ? "vip" : ordersCount >= 2 ? "recorrente" : "novo",
    },
  });
}

export async function getMeCashbackBalance(customerId: string) {
  const rows = await import("../models/CashbackLedger").then(({ CashbackLedgerModel }) =>
    CashbackLedgerModel.find({ customerId }).sort({ createdAt: -1 }),
  );

  const balance = rows.length ? rows[0]!.balanceAfterCents : 0;

  return {
    balance: fromCents(balance),
    balanceCents: balance,
  };
}

export async function createCustomerFromGuest(input: { name: string; email: string; phone?: string; passwordHash: string }) {
  const created = await CustomerModel.create({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone,
    passwordHash: input.passwordHash,
    segment: "novo",
    ordersCount: 0,
    totalSpentCents: toCents(0),
  });
  return created;
}

export { toCustomer, toOrder, toAddress, toFavorite };
