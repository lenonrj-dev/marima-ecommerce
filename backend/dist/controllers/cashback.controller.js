"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeCashbackBalanceHandler = exports.redeemCashbackStoreHandler = exports.listCashbackLedgerHandler = exports.toggleCashbackRuleHandler = exports.patchCashbackRuleHandler = exports.createCashbackRuleHandler = exports.listCashbackRulesHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const cashback_service_1 = require("../services/cashback.service");
exports.listCashbackRulesHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, cashback_service_1.listCashbackRules)({ page, limit });
    res.json(result);
});
exports.createCashbackRuleHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, cashback_service_1.createCashbackRule)(req.body);
    res.status(201).json({ data });
});
exports.patchCashbackRuleHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, cashback_service_1.updateCashbackRule)(String(req.params.id), req.body);
    res.json({ data });
});
exports.toggleCashbackRuleHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, cashback_service_1.toggleCashbackRule)(String(req.params.id));
    res.json({ data });
});
exports.listCashbackLedgerHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, cashback_service_1.listCashbackLedger)({
        page,
        limit,
        customerId: String(req.query.customerId || "").trim() || undefined,
    });
    res.json(result);
});
exports.redeemCashbackStoreHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    if (!req.auth || req.auth.type !== "customer") {
        res.status(401).json({ code: "AUTH_REQUIRED", message: "Login necessário para usar cashback." });
        return;
    }
    const data = await (0, cashback_service_1.redeemCashback)({
        customerId: req.auth.sub,
        amount: Number(req.body.amount || 0),
        orderId: req.body.orderId,
    });
    res.json({ data });
});
exports.getMeCashbackBalanceHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, cashback_service_1.getCustomerCashbackBalance)(req.auth.sub);
    res.json({ data });
});
