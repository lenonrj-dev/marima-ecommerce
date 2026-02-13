"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMercadoPagoPendingExpiryJob = startMercadoPagoPendingExpiryJob;
const env_1 = require("../config/env");
const PaymentTransaction_1 = require("../models/PaymentTransaction");
const mercadopago_service_1 = require("../services/mercadopago.service");
const DEFAULT_TTL_MINUTES = 30;
const DEFAULT_INTERVAL_MS = 60_000;
const MAX_BATCH = 25;
function resolveTtlMinutes() {
    const value = Number(env_1.env.MP_PENDING_ORDER_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
    if (!Number.isFinite(value) || value <= 0)
        return DEFAULT_TTL_MINUTES;
    return Math.floor(value);
}
async function expireOnce(ttlMinutes) {
    const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
    const rows = await PaymentTransaction_1.PaymentTransactionModel.find({
        provider: "mercadopago",
        status: { $in: ["initiated", "pending"] },
        createdAt: { $lt: cutoff },
    })
        .sort({ createdAt: 1 })
        .limit(MAX_BATCH);
    for (const tx of rows) {
        const orderId = String(tx.orderId);
        const cancelToken = tx.cancelToken ? String(tx.cancelToken) : "";
        if (!cancelToken)
            continue;
        try {
            await (0, mercadopago_service_1.cancelMercadoPagoOrder)({ orderId, cancelToken });
        }
        catch {
            // Evita derrubar o processo por falha pontual.
        }
    }
}
function startMercadoPagoPendingExpiryJob() {
    const ttlMinutes = resolveTtlMinutes();
    console.log(`[JOB] Mercado Pago: expiração de pedidos pendentes ativa (TTL=${ttlMinutes}min).`);
    void expireOnce(ttlMinutes);
    const handle = setInterval(() => {
        void expireOnce(ttlMinutes);
    }, DEFAULT_INTERVAL_MS);
    handle.unref();
    return handle;
}
