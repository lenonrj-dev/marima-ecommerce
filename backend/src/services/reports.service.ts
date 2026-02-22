import { OrderModel } from "../models/Order";
import { ProductModel } from "../models/Product";
import { CustomerModel } from "../models/Customer";
import { fromCents } from "../utils/money";

function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header] ?? "";
      const text = String(value).replace(/"/g, '""');
      return `"${text}"`;
    });
    lines.push(values.join(","));
  }

  return lines.join("\n");
}

export async function exportSalesCsv() {
  const rows = await OrderModel.find().sort({ createdAt: -1 }).limit(5000);
  const content = toCsv(
    rows.map((order) => ({
      code: order.code,
      customerName: order.customerName,
      email: order.email,
      status: order.status,
      channel: order.channel,
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      itemsCount: order.itemsCount,
      total: fromCents(order.totalCents),
      createdAt: order.createdAt.toISOString(),
    })),
  );

  return {
    filename: `vendas-${Date.now()}.csv`,
    content,
  };
}

export async function exportProductsCsv() {
  const rows = await ProductModel.find().sort({ updatedAt: -1 }).limit(5000);
  const content = toCsv(
    rows.map((product) => ({
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      category: product.category,
      status: product.status,
      active: product.active ? "sim" : "nao",
      stock: product.stock,
      price: fromCents(product.priceCents),
      compareAtPrice: product.compareAtPriceCents ? fromCents(product.compareAtPriceCents) : "",
      updatedAt: product.updatedAt.toISOString(),
    })),
  );

  return {
    filename: `produtos-${Date.now()}.csv`,
    content,
  };
}

export async function exportCustomersCsv() {
  const rows = await CustomerModel.find().sort({ createdAt: -1 }).limit(5000);
  const content = toCsv(
    rows.map((customer) => ({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      segment: customer.segment,
      ordersCount: customer.ordersCount,
      totalSpent: fromCents(customer.totalSpentCents),
      lastOrderAt: customer.lastOrderAt ? customer.lastOrderAt.toISOString() : "",
      createdAt: customer.createdAt.toISOString(),
    })),
  );

  return {
    filename: `clientes-${Date.now()}.csv`,
    content,
  };
}
