import { OrderModel } from "../models/Order";
import { ProductModel } from "../models/Product";
import { CustomerModel } from "../models/Customer";
import { fromCents } from "../utils/money";

const REVENUE_STATUSES = ["pago", "separacao", "enviado", "entregue"];

function periodStart(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, days - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getOverview(periodDays = 30) {
  const start = periodStart(periodDays);

  const [ordersAgg, ordersCount, customersCount, lowStock] = await Promise.all([
    OrderModel.aggregate([
      { $match: { createdAt: { $gte: start }, status: { $in: REVENUE_STATUSES } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalCents" },
        },
      },
    ]),
    OrderModel.countDocuments({ createdAt: { $gte: start } }),
    CustomerModel.countDocuments(),
    ProductModel.countDocuments({ stock: { $lte: 5 } }),
  ]);

  const revenueCents = ordersAgg[0]?.revenue || 0;
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

  const rows = await OrderModel.aggregate([
    {
      $match: {
        createdAt: { $gte: start },
        status: { $in: REVENUE_STATUSES },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        value: { $sum: "$totalCents" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  const map = new Map<string, number>();
  for (const row of rows) {
    const date = new Date(Date.UTC(row._id.year, row._id.month - 1, row._id.day));
    const key = date.toISOString().slice(0, 10);
    map.set(key, row.value);
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
