import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents, toCents } from "../utils/money";

function toRule(rule: any) {
  return {
    id: String(rule.id),
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
    id: String(row.id),
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
  const last = await prisma.cashbackLedger.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { balanceAfterCents: true },
  });
  return last?.balanceAfterCents || 0;
}

export async function listCashbackRules(input: { page: number; limit: number }) {
  const [rows, total] = await Promise.all([
    prisma.cashbackRule.findMany({
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.cashbackRule.count(),
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
  const created = await prisma.cashbackRule.create({
    data: {
      name: input.name,
      percent: input.percent,
      validDays: input.validDays,
      minSubtotalCents: toCents(input.minSubtotal),
      maxCashbackCents: toCents(input.maxCashback),
      active: input.active ?? true,
    },
  });

  return toRule(created);
}

export async function updateCashbackRule(
  id: string,
  input: Partial<{ name: string; percent: number; validDays: number; minSubtotal: number; maxCashback: number; active: boolean }>,
) {
  const rule = await prisma.cashbackRule.findUnique({ where: { id } });
  if (!rule) throw new ApiError(404, "Regra de cashback não encontrada.");

  const updated = await prisma.cashbackRule.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.percent !== undefined ? { percent: input.percent } : {}),
      ...(input.validDays !== undefined ? { validDays: input.validDays } : {}),
      ...(input.minSubtotal !== undefined ? { minSubtotalCents: toCents(input.minSubtotal) } : {}),
      ...(input.maxCashback !== undefined ? { maxCashbackCents: toCents(input.maxCashback) } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });

  return toRule(updated);
}

export async function toggleCashbackRule(id: string) {
  const rule = await prisma.cashbackRule.findUnique({ where: { id } });
  if (!rule) throw new ApiError(404, "Regra de cashback não encontrada.");

  const updated = await prisma.cashbackRule.update({
    where: { id },
    data: { active: !rule.active },
  });
  return toRule(updated);
}

export async function listCashbackLedger(input: { page: number; limit: number; customerId?: string }) {
  const where: any = {};
  if (input.customerId) where.customerId = input.customerId;

  const [rows, total] = await Promise.all([
    prisma.cashbackLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.cashbackLedger.count({ where }),
  ]);

  return { data: rows.map(toLedger), meta: buildMeta(total, input.page, input.limit) };
}

export async function grantCashbackForOrder(input: {
  customerId?: string;
  orderId: string;
  subtotalCents: number;
}) {
  if (!input.customerId) return { grantedCents: 0 };

  const rule = await prisma.cashbackRule.findFirst({
    where: { active: true },
    orderBy: [{ percent: "desc" }, { createdAt: "desc" }],
  });
  if (!rule) return { grantedCents: 0 };
  if (input.subtotalCents < rule.minSubtotalCents) return { grantedCents: 0 };

  const raw = Math.round(input.subtotalCents * (rule.percent / 100));
  const grantedCents = Math.min(raw, rule.maxCashbackCents);
  if (grantedCents <= 0) return { grantedCents: 0 };

  const current = await getCurrentBalanceCents(input.customerId);
  const balanceAfter = current + grantedCents;
  const expiresAt = new Date(Date.now() + rule.validDays * 24 * 60 * 60 * 1000);

  await prisma.cashbackLedger.create({
    data: {
      customerId: input.customerId,
      orderId: input.orderId,
      type: "credit",
      amountCents: grantedCents,
      balanceAfterCents: balanceAfter,
      expiresAt,
      note: `Cashback do pedido ${input.orderId}`,
    },
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

  await prisma.cashbackLedger.create({
    data: {
      customerId: input.customerId,
      orderId: input.orderId,
      type: "debit",
      amountCents: -amountCents,
      balanceAfterCents: balanceAfter,
      note: "Resgate de cashback",
    },
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
