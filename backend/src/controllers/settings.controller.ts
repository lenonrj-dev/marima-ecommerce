import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { getStoreSettings, updateStoreSettings } from "../services/settings.service";

export const getStoreSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getStoreSettings();
  res.json({ data });
});

export const patchStoreSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateStoreSettings(req.body);
  res.json({ data });
});
