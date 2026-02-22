import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { listIntegrations, testIntegrationWebhook, updateIntegration } from "../services/integrations.service";

export const listIntegrationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));

  const result = await listIntegrations({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
  });

  res.json(result);
});

export const patchIntegrationHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateIntegration(String(req.params.id), req.body);
  res.json({ data });
});

export const testIntegrationWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await testIntegrationWebhook(String(req.params.id));
  res.json({ data });
});

