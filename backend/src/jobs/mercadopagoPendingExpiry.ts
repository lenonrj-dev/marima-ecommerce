import { env } from "../config/env";
import { PaymentTransactionModel } from "../models/PaymentTransaction";
import { cancelMercadoPagoOrder } from "../services/mercadopago.service";

const DEFAULT_TTL_MINUTES = 30;
const DEFAULT_INTERVAL_MS = 60_000;
const MAX_BATCH = 25;

function resolveTtlMinutes() {
  const value = Number(env.MP_PENDING_ORDER_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_TTL_MINUTES;
  return Math.floor(value);
}

async function expireOnce(ttlMinutes: number) {
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

  const rows = await PaymentTransactionModel.find({
    provider: "mercadopago",
    status: { $in: ["initiated", "pending"] },
    createdAt: { $lt: cutoff },
  })
    .sort({ createdAt: 1 })
    .limit(MAX_BATCH);

  for (const tx of rows) {
    const orderId = String(tx.orderId);
    const cancelToken = tx.cancelToken ? String(tx.cancelToken) : "";
    if (!cancelToken) continue;

    try {
      await cancelMercadoPagoOrder({ orderId, cancelToken });
    } catch {
      // Evita derrubar o processo por falha pontual.
    }
  }
}

export function startMercadoPagoPendingExpiryJob() {
  const ttlMinutes = resolveTtlMinutes();
  console.log(`[JOB] Mercado Pago: expiração de pedidos pendentes ativa (TTL=${ttlMinutes}min).`);

  void expireOnce(ttlMinutes);

  const handle = setInterval(() => {
    void expireOnce(ttlMinutes);
  }, DEFAULT_INTERVAL_MS);

  handle.unref();
  return handle;
}

