"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverview = getOverview;
exports.getRevenueSeries = getRevenueSeries;
exports.getDeviceBreakdown = getDeviceBreakdown;
exports.getEmailCampaigns = getEmailCampaigns;
const prisma_1 = require("../lib/prisma");
const money_1 = require("../utils/money");
const REVENUE_STATUSES = ["pago", "separacao", "enviado", "entregue"];
function periodStart(days) {
    const date = new Date();
    date.setDate(date.getDate() - Math.max(0, days - 1));
    date.setHours(0, 0, 0, 0);
    return date;
}
async function getOverview(periodDays = 30) {
    const start = periodStart(periodDays);
    const [ordersAgg, ordersCount, customersCount, lowStock] = await Promise.all([
        prisma_1.prisma.order.aggregate({
            where: {
                createdAt: { gte: start },
                status: { in: [...REVENUE_STATUSES] },
            },
            _sum: { totalCents: true },
        }),
        prisma_1.prisma.order.count({ where: { createdAt: { gte: start } } }),
        prisma_1.prisma.customer.count(),
        prisma_1.prisma.product.count({ where: { stock: { lte: 5 } } }),
    ]);
    const revenueCents = ordersAgg._sum.totalCents || 0;
    const avgOrderValue = ordersCount ? revenueCents / ordersCount : 0;
    const conversionRate = customersCount ? Math.min(1, ordersCount / Math.max(customersCount, 1)) : 0;
    return {
        revenue: (0, money_1.fromCents)(revenueCents),
        orders: ordersCount,
        customers: customersCount,
        conversionRate,
        avgOrderValue: (0, money_1.fromCents)(avgOrderValue),
        clicks: 0,
        emailsSent: 0,
        lowStock,
    };
}
async function getRevenueSeries(days = 14) {
    const start = periodStart(days);
    const rows = (await prisma_1.prisma.$queryRaw `
    SELECT
      date_trunc('day', "createdAt") AS day,
      COALESCE(SUM("totalCents"), 0)::bigint AS value
    FROM "Order"
    WHERE "createdAt" >= ${start}
      AND "status" IN ('pago','separacao','enviado','entregue')
    GROUP BY day
    ORDER BY day ASC
  `);
    const map = new Map();
    for (const row of rows) {
        const date = new Date(row.day);
        const key = date.toISOString().slice(0, 10);
        map.set(key, Number(row.value || 0));
    }
    const result = [];
    for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        result.push({
            date: d.toISOString(),
            value: (0, money_1.fromCents)(map.get(key) || 0),
        });
    }
    return result;
}
async function getDeviceBreakdown() {
    return [];
}
async function getEmailCampaigns() {
    return [];
}
