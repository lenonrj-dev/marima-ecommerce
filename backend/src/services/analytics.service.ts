import { prisma } from "../lib/prisma";
import { fromCents } from "../utils/money";

const REVENUE_STATUSES = ["pago", "separacao", "enviado", "entregue"] as const;

function periodStart(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, days - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getOverview(periodDays = 30) {
  const start = periodStart(periodDays);

  const [ordersAgg, ordersCount, customersCount, lowStock] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: start },
        status: { in: [...REVENUE_STATUSES] as any },
      },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: start } } }),
    prisma.customer.count(),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
  ]);

  const revenueCents = ordersAgg._sum.totalCents || 0;
  const avgOrderValue = ordersCount ? revenueCents / ordersCount : 0;
  const conversionRate = customersCount ? Math.min(1, ordersCount / Math.max(customersCount, 1)) : 0;

  return {
    revenue: fromCents(revenueCents),
    orders: ordersCount,
    customers: customersCount,
    conversionRate,
    avgOrderValue: fromCents(avgOrderValue),
    clicks: 0,
    emailsSent: 0,
    lowStock,
  };
}

export async function getRevenueSeries(days = 14) {
  const start = periodStart(days);

  const rows = (await prisma.$queryRaw`
    SELECT
      date_trunc('day', "createdAt") AS day,
      COALESCE(SUM("totalCents"), 0)::bigint AS value
    FROM "Order"
    WHERE "createdAt" >= ${start}
      AND "status" IN ('pago','separacao','enviado','entregue')
    GROUP BY day
    ORDER BY day ASC
  `) as Array<{ day: Date; value: bigint | number | string }>;

  const map = new Map<string, number>();
  for (const row of rows) {
    const date = new Date(row.day);
    const key = date.toISOString().slice(0, 10);
    map.set(key, Number(row.value || 0));
  }

  const result: Array<{ date: string; value: number }> = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    result.push({
      date: d.toISOString(),
      value: fromCents(map.get(key) || 0),
    });
  }

  return result;
}

export async function getDeviceBreakdown() {
  return [] as Array<{ label: string; opened: number; clicks: number }>;
}

export async function getEmailCampaigns() {
  return [] as Array<{
    id: string;
    name: string;
    publishDate: string;
    sent: number;
    ctr: number;
    deliveredRate: number;
    unsubscribeRate: number;
    spamRate: number;
  }>;
}
