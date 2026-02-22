import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { exportCustomersCsv, exportProductsCsv, exportSalesCsv } from "../services/reports.service";

function sendCsv(res: Response, filename: string, content: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.status(200).send(content);
}

export const exportSalesCsvHandler = asyncHandler(async (_req: Request, res: Response) => {
  const file = await exportSalesCsv();
  sendCsv(res, file.filename, file.content);
});

export const exportProductsCsvHandler = asyncHandler(async (_req: Request, res: Response) => {
  const file = await exportProductsCsv();
  sendCsv(res, file.filename, file.content);
});

export const exportCustomersCsvHandler = asyncHandler(async (_req: Request, res: Response) => {
  const file = await exportCustomersCsv();
  sendCsv(res, file.filename, file.content);
});
