"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCashbackRules = listCashbackRules;
exports.createCashbackRule = createCashbackRule;
exports.updateCashbackRule = updateCashbackRule;
exports.toggleCashbackRule = toggleCashbackRule;
exports.listCashbackLedger = listCashbackLedger;
exports.grantCashbackForOrder = grantCashbackForOrder;
exports.redeemCashback = redeemCashback;
exports.getCustomerCashbackBalance = getCustomerCashbackBalance;
exports.toRule = toRule;
exports.toLedger = toLedger;
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
function toRule(rule) {
    return {
        id: String(rule.id),
        name: rule.name,
        percent: rule.percent,
        validDays: rule.validDays,
        minSubtotal: (0, money_1.fromCents)(rule.minSubtotalCents),
        maxCashback: (0, money_1.fromCents)(rule.maxCashbackCents),
        active: rule.active,
        createdAt: rule.createdAt?.toISOString(),
        updatedAt: rule.updatedAt?.toISOString(),
    };
}
function toLedger(row) {
    return {
        id: String(row.id),
        customerId: String(row.customerId),
        orderId: row.orderId ? String(row.orderId) : undefined,
        type: row.type,
        amount: (0, money_1.fromCents)(row.amountCents),
        balanceAfter: (0, money_1.fromCents)(row.balanceAfterCents),
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined,
        note: row.note,
        createdAt: row.createdAt?.toISOString(),
    };
}
async function getCurrentBalanceCents(customerId) {
    const last = await prisma_1.prisma.cashbackLedger.findFirst({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        select: { balanceAfterCents: true },
    });
    return last?.balanceAfterCents || 0;
}
async function listCashbackRules(input) {
    const [rows, total] = await Promise.all([
        prisma_1.prisma.cashbackRule.findMany({
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.cashbackRule.count(),
    ]);
    return { data: rows.map(toRule), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function createCashbackRule(input) {
    const created = await prisma_1.prisma.cashbackRule.create({
        data: {
            name: input.name,
            percent: input.percent,
            validDays: input.validDays,
            minSubtotalCents: (0, money_1.toCents)(input.minSubtotal),
            maxCashbackCents: (0, money_1.toCents)(input.maxCashback),
            active: input.active ?? true,
        },
    });
    return toRule(created);
}
async function updateCashbackRule(id, input) {
    const rule = await prisma_1.prisma.cashbackRule.findUnique({ where: { id } });
    if (!rule)
        throw new apiError_1.ApiError(404, "Regra de cashback n�o encontrada.");
    const updated = await prisma_1.prisma.cashbackRule.update({
        where: { id },
        data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.percent !== undefined ? { percent: input.percent } : {}),
            ...(input.validDays !== undefined ? { validDays: input.validDays } : {}),
            ...(input.minSubtotal !== undefined ? { minSubtotalCents: (0, money_1.toCents)(input.minSubtotal) } : {}),
            ...(input.maxCashback !== undefined ? { maxCashbackCents: (0, money_1.toCents)(input.maxCashback) } : {}),
            ...(input.active !== undefined ? { active: input.active } : {}),
        },
    });
    return toRule(updated);
}
async function toggleCashbackRule(id) {
    const rule = await prisma_1.prisma.cashbackRule.findUnique({ where: { id } });
    if (!rule)
        throw new apiError_1.ApiError(404, "Regra de cashback n�o encontrada.");
    const updated = await prisma_1.prisma.cashbackRule.update({
        where: { id },
        data: { active: !rule.active },
    });
    return toRule(updated);
}
async function listCashbackLedger(input) {
    const where = {};
    if (input.customerId)
        where.customerId = input.customerId;
    const [rows, total] = await Promise.all([
        prisma_1.prisma.cashbackLedger.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.cashbackLedger.count({ where }),
    ]);
    return { data: rows.map(toLedger), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function grantCashbackForOrder(input) {
    if (!input.customerId)
        return { grantedCents: 0 };
    const rule = await prisma_1.prisma.cashbackRule.findFirst({
        where: { active: true },
        orderBy: [{ percent: "desc" }, { createdAt: "desc" }],
    });
    if (!rule)
        return { grantedCents: 0 };
    if (input.subtotalCents < rule.minSubtotalCents)
        return { grantedCents: 0 };
    const raw = Math.round(input.subtotalCents * (rule.percent / 100));
    const grantedCents = Math.min(raw, rule.maxCashbackCents);
    if (grantedCents <= 0)
        return { grantedCents: 0 };
    const current = await getCurrentBalanceCents(input.customerId);
    const balanceAfter = current + grantedCents;
    const expiresAt = new Date(Date.now() + rule.validDays * 24 * 60 * 60 * 1000);
    await prisma_1.prisma.cashbackLedger.create({
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
async function redeemCashback(input) {
    const amountCents = (0, money_1.toCents)(input.amount);
    const current = await getCurrentBalanceCents(input.customerId);
    if (amountCents <= 0)
        throw new apiError_1.ApiError(400, "Valor inv�lido para resgate.");
    if (current < amountCents)
        throw new apiError_1.ApiError(400, "Saldo de cashback insuficiente.");
    const balanceAfter = current - amountCents;
    await prisma_1.prisma.cashbackLedger.create({
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
        balance: (0, money_1.fromCents)(balanceAfter),
    };
}
async function getCustomerCashbackBalance(customerId) {
    const balanceCents = await getCurrentBalanceCents(customerId);
    return { balanceCents, balance: (0, money_1.fromCents)(balanceCents) };
}
