import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { getDeviceBreakdown, getEmailCampaigns, getOverview, getRevenueSeries } from "../services/analytics.service";

export const analyticsOverviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const period = Math.max(1, Number(req.query.period || 30));
  const data = await getOverview(period);
  res.json({ data });
});

export const analyticsRevenueSeriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.max(1, Number(req.query.days || req.query.period || 14));
  const data = await getRevenueSeries(days);
  res.json({ data });
});

export const analyticsDeviceHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getDeviceBreakdown();
  res.json({ data });
});

export const analyticsEmailCampaignsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getEmailCampaigns();
  res.json({ data });
});
