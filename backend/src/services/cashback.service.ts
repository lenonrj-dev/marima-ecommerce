import { Types } from "../lib/dbCompat";
import { CashbackLedgerModel } from "../models/CashbackLedger";
import { CashbackRuleModel } from "../models/CashbackRule";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents, toCents } from "../utils/money";

function toRule(rule: any) {
  return {
    id: String(rule._id),
    name: rule.name,
    percent: rule.percent,
    validDays: rule.validDays,
    minSubtotal: fromCents(rule.minSubtotalCents),
    maxCashback: fromCents(rule.maxCashbackCents),
    active: rule.active,
    createdAt: rule.createdAt?.toISOString(),
    updatedAt: rule.updatedAt?.toISOString(),
  };
}

function toLedger(row: any) {
  return {
    id: String(row._id),
    customerId: String(row.customerId),
    orderId: row.orderId ? String(row.orderId) : undefined,
    type: row.type,
    amount: fromCents(row.amountCents),
    balanceAfter: fromCents(row.balanceAfterCents),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined,
    note: row.note,
    createdAt: row.createdAt?.toISOString(),
  };
}

async function getCurrentBalanceCents(customerId: string) {
  const last = await CashbackLedgerModel.findOne({ customerId }).sort({ createdAt: -1 });
  return last?.balanceAfterCents || 0;
}

export async function listCashbackRules(input: { page: number; limit: number }) {
  const [rows, total] = await Promise.all([
    CashbackRuleModel.find().sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit),
    CashbackRuleModel.countDocuments(),
  ]);

  return { data: rows.map(toRule), meta: buildMeta(total, input.page, input.limit) };
}

export async function createCashbackRule(input: {
  name: string;
  percent: number;
  validDays: number;
  minSubtotal: number;
  maxCashback: number;
  active?: boolean;
}) {
  const created = await CashbackRuleModel.create({
    name: input.name,
    percent: input.percent,
    validDays: input.validDays,
    minSubtotalCents: toCents(input.minSubtotal),
    maxCashbackCents: toCents(input.maxCashback),
    active: input.active ?? true,
  });

  return toRule(created);
}

export async function updateCashbackRule(
  id: string,
  input: Partial<{ name: string; percent: number; validDays: number; minSubtotal: number; maxCashback: number; active: boolean }>,
) {
  const rule = await CashbackRuleModel.findById(id);
  if (!rule) throw new ApiError(404, "Regra de cashback não encontrada.");

  if (input.name !== undefined) rule.name = input.name;
  if (input.percent !== undefined) rule.percent = input.percent;
  if (input.validDays !== undefined) rule.validDays = input.validDays;
  if (input.minSubtotal !== undefined) rule.minSubtotalCents = toCents(input.minSubtotal);
  if (input.maxCashback !== undefined) rule.maxCashbackCents = toCents(input.maxCashback);
  if (input.active !== undefined) rule.active = input.active;

  await rule.save();
  return toRule(rule);
}

export async function toggleCashbackRule(id: string) {
  const rule = await CashbackRuleModel.findById(id);
  if (!rule) throw new ApiError(404, "Regra de cashback não encontrada.");
  rule.active = !rule.active;
  await rule.save();
  return toRule(rule);
}

export async function listCashbackLedger(input: { page: number; limit: number; customerId?: string }) {
  const query: any = {};
  if (input.customerId) query.customerId = input.customerId;

  const [rows, total] = await Promise.all([
    CashbackLedgerModel.find(query).sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit),
    CashbackLedgerModel.countDocuments(query),
  ]);

  return { data: rows.map(toLedger), meta: buildMeta(total, input.page, input.limit) };
}

export async function grantCashbackForOrder(input: {
  customerId?: string;
  orderId: string;
  subtotalCents: number;
}) {
  if (!input.customerId) return { grantedCents: 0 };

  const rule = await CashbackRuleModel.findOne({ active: true }).sort({ percent: -1, createdAt: -1 });
  if (!rule) return { grantedCents: 0 };
  if (input.subtotalCents < rule.minSubtotalCents) return { grantedCents: 0 };

  const raw = Math.round(input.subtotalCents * (rule.percent / 100));
  const grantedCents = Math.min(raw, rule.maxCashbackCents);
  if (grantedCents <= 0) return { grantedCents: 0 };

  const current = await getCurrentBalanceCents(input.customerId);
  const balanceAfter = current + grantedCents;
  const expiresAt = new Date(Date.now() + rule.validDays * 24 * 60 * 60 * 1000);

  await CashbackLedgerModel.create({
    customerId: input.customerId,
    orderId: input.orderId,
    type: "credit",
    amountCents: grantedCents,
    balanceAfterCents: balanceAfter,
    expiresAt,
    note: `Cashback do pedido ${input.orderId}`,
  });

  return { grantedCents };
}

export async function redeemCashback(input: {
  customerId: string;
  amount: number;
  orderId?: string;
}) {
  const amountCents = toCents(input.amount);
  const current = await getCurrentBalanceCents(input.customerId);
  if (amountCents <= 0) throw new ApiError(400, "Valor inválido para resgate.");
  if (current < amountCents) throw new ApiError(400, "Saldo de cashback insuficiente.");

  const balanceAfter = current - amountCents;

  await CashbackLedgerModel.create({
    customerId: input.customerId,
    orderId: input.orderId ? new Types.ObjectId(input.orderId) : undefined,
    type: "debit",
    amountCents: -amountCents,
    balanceAfterCents: balanceAfter,
    note: "Resgate de cashback",
  });

  return {
    usedCents: amountCents,
    balanceCents: balanceAfter,
    balance: fromCents(balanceAfter),
  };
}

export async function getCustomerCashbackBalance(customerId: string) {
  const balanceCents = await getCurrentBalanceCents(customerId);
  return { balanceCents, balance: fromCents(balanceCents) };
}

export { toRule, toLedger };

