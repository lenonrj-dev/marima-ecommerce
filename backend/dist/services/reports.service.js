"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSalesCsv = exportSalesCsv;
exports.exportProductsCsv = exportProductsCsv;
exports.exportCustomersCsv = exportCustomersCsv;
const prisma_1 = require("../lib/prisma");
const money_1 = require("../utils/money");
function toCsv(rows) {
    if (!rows.length)
        return "";
    const headers = Object.keys(rows[0]);
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
async function exportSalesCsv() {
    const rows = await prisma_1.prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
    });
    const content = toCsv(rows.map((order) => ({
        code: order.code,
        customerName: order.customerName,
        email: order.email,
        status: order.status,
        channel: order.channel,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        itemsCount: order.itemsCount,
        total: (0, money_1.fromCents)(order.totalCents),
        createdAt: order.createdAt.toISOString(),
    })));
    return {
        filename: `vendas-${Date.now()}.csv`,
        content,
    };
}
async function exportProductsCsv() {
    const rows = await prisma_1.prisma.product.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5000,
    });
    const content = toCsv(rows.map((product) => ({
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        category: product.category,
        status: product.status,
        active: product.active ? "sim" : "não",
        stock: product.stock,
        price: (0, money_1.fromCents)(product.priceCents),
        compareAtPrice: product.compareAtPriceCents ? (0, money_1.fromCents)(product.compareAtPriceCents) : "",
        updatedAt: product.updatedAt.toISOString(),
    })));
    return {
        filename: `produtos-${Date.now()}.csv`,
        content,
    };
}
async function exportCustomersCsv() {
    const rows = await prisma_1.prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
    });
    const content = toCsv(rows.map((customer) => ({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        segment: customer.segment,
        ordersCount: customer.ordersCount,
        totalSpent: (0, money_1.fromCents)(customer.totalSpentCents),
        lastOrderAt: customer.lastOrderAt ? customer.lastOrderAt.toISOString() : "",
        createdAt: customer.createdAt.toISOString(),
    })));
    return {
        filename: `clientes-${Date.now()}.csv`,
        content,
    };
}
