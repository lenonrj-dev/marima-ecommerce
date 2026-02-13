"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverview = getOverview;
exports.getRevenueSeries = getRevenueSeries;
exports.getDeviceBreakdown = getDeviceBreakdown;
exports.getEmailCampaigns = getEmailCampaigns;
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const Customer_1 = require("../models/Customer");
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
        Order_1.OrderModel.aggregate([
            { $match: { createdAt: { $gte: start }, status: { $in: REVENUE_STATUSES } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$totalCents" },
                },
            },
        ]),
        Order_1.OrderModel.countDocuments({ createdAt: { $gte: start } }),
        Customer_1.CustomerModel.countDocuments(),
        Product_1.ProductModel.countDocuments({ stock: { $lte: 5 } }),
    ]);
    const revenueCents = ordersAgg[0]?.revenue || 0;
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
    const rows = await Order_1.OrderModel.aggregate([
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
    const map = new Map();
    for (const row of rows) {
        const date = new Date(Date.UTC(row._id.year, row._id.month - 1, row._id.day));
        const key = date.toISOString().slice(0, 10);
        map.set(key, row.value);
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
