"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsEmailCampaignsHandler = exports.analyticsDeviceHandler = exports.analyticsRevenueSeriesHandler = exports.analyticsOverviewHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const analytics_service_1 = require("../services/analytics.service");
exports.analyticsOverviewHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const period = Math.max(1, Number(req.query.period || 30));
    const data = await (0, analytics_service_1.getOverview)(period);
    res.json({ data });
});
exports.analyticsRevenueSeriesHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const days = Math.max(1, Number(req.query.days || req.query.period || 14));
    const data = await (0, analytics_service_1.getRevenueSeries)(days);
    res.json({ data });
});
exports.analyticsDeviceHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const data = await (0, analytics_service_1.getDeviceBreakdown)();
    res.json({ data });
});
exports.analyticsEmailCampaignsHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const data = await (0, analytics_service_1.getEmailCampaigns)();
    res.json({ data });
});
