import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  createCashbackRule,
  getCustomerCashbackBalance,
  listCashbackLedger,
  listCashbackRules,
  redeemCashback,
  toggleCashbackRule,
  updateCashbackRule,
} from "../services/cashback.service";

export const listCashbackRulesHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listCashbackRules({ page, limit });
  res.json(result);
});

export const createCashbackRuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createCashbackRule(req.body);
  res.status(201).json({ data });
});

export const patchCashbackRuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateCashbackRule(String(req.params.id), req.body);
  res.json({ data });
});

export const toggleCashbackRuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await toggleCashbackRule(String(req.params.id));
  res.json({ data });
});

export const listCashbackLedgerHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const result = await listCashbackLedger({
    page,
    limit,
    customerId: String(req.query.customerId || "").trim() || undefined,
  });
  res.json(result);
});

export const redeemCashbackStoreHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth || req.auth.type !== "customer") {
    res.status(401).json({ code: "AUTH_REQUIRED", message: "Login necessário para usar cashback." });
    return;
  }

  const data = await redeemCashback({
    customerId: req.auth.sub,
    amount: Number(req.body.amount || 0),
    orderId: req.body.orderId,
  });

  res.json({ data });
});

export const getMeCashbackBalanceHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getCustomerCashbackBalance(req.auth!.sub);
  res.json({ data });
});

