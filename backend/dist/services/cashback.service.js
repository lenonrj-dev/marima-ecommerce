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
const mongoose_1 = require("mongoose");
const CashbackLedger_1 = require("../models/CashbackLedger");
const CashbackRule_1 = require("../models/CashbackRule");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
function toRule(rule) {
    return {
        id: String(rule._id),
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
        id: String(row._id),
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
    const last = await CashbackLedger_1.CashbackLedgerModel.findOne({ customerId }).sort({ createdAt: -1 });
    return last?.balanceAfterCents || 0;
}
async function listCashbackRules(input) {
    const [rows, total] = await Promise.all([
        CashbackRule_1.CashbackRuleModel.find().sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit),
        CashbackRule_1.CashbackRuleModel.countDocuments(),
    ]);
    return { data: rows.map(toRule), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function createCashbackRule(input) {
    const created = await CashbackRule_1.CashbackRuleModel.create({
        name: input.name,
        percent: input.percent,
        validDays: input.validDays,
        minSubtotalCents: (0, money_1.toCents)(input.minSubtotal),
        maxCashbackCents: (0, money_1.toCents)(input.maxCashback),
        active: input.active ?? true,
    });
    return toRule(created);
}
async function updateCashbackRule(id, input) {
    const rule = await CashbackRule_1.CashbackRuleModel.findById(id);
    if (!rule)
        throw new apiError_1.ApiError(404, "Regra de cashback não encontrada.");
    if (input.name !== undefined)
        rule.name = input.name;
    if (input.percent !== undefined)
        rule.percent = input.percent;
    if (input.validDays !== undefined)
        rule.validDays = input.validDays;
    if (input.minSubtotal !== undefined)
        rule.minSubtotalCents = (0, money_1.toCents)(input.minSubtotal);
    if (input.maxCashback !== undefined)
        rule.maxCashbackCents = (0, money_1.toCents)(input.maxCashback);
    if (input.active !== undefined)
        rule.active = input.active;
    await rule.save();
    return toRule(rule);
}
async function toggleCashbackRule(id) {
    const rule = await CashbackRule_1.CashbackRuleModel.findById(id);
    if (!rule)
        throw new apiError_1.ApiError(404, "Regra de cashback não encontrada.");
    rule.active = !rule.active;
    await rule.save();
    return toRule(rule);
}
async function listCashbackLedger(input) {
    const query = {};
    if (input.customerId)
        query.customerId = input.customerId;
    const [rows, total] = await Promise.all([
        CashbackLedger_1.CashbackLedgerModel.find(query).sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit),
        CashbackLedger_1.CashbackLedgerModel.countDocuments(query),
    ]);
    return { data: rows.map(toLedger), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function grantCashbackForOrder(input) {
    if (!input.customerId)
        return { grantedCents: 0 };
    const rule = await CashbackRule_1.CashbackRuleModel.findOne({ active: true }).sort({ percent: -1, createdAt: -1 });
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
    await CashbackLedger_1.CashbackLedgerModel.create({
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
async function redeemCashback(input) {
    const amountCents = (0, money_1.toCents)(input.amount);
    const current = await getCurrentBalanceCents(input.customerId);
    if (amountCents <= 0)
        throw new apiError_1.ApiError(400, "Valor inválido para resgate.");
    if (current < amountCents)
        throw new apiError_1.ApiError(400, "Saldo de cashback insuficiente.");
    const balanceAfter = current - amountCents;
    await CashbackLedger_1.CashbackLedgerModel.create({
        customerId: input.customerId,
        orderId: input.orderId ? new mongoose_1.Types.ObjectId(input.orderId) : undefined,
        type: "debit",
        amountCents: -amountCents,
        balanceAfterCents: balanceAfter,
        note: "Resgate de cashback",
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
