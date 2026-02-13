import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { env } from "../config/env";
import { CartModel } from "../models/Cart";
import { OrderModel } from "../models/Order";
import { PaymentTransactionModel } from "../models/PaymentTransaction";
import { ProductModel } from "../models/Product";
import { InventoryMovementModel } from "../models/InventoryMovement";
import { ApiError } from "../utils/apiError";
import { fromCents } from "../utils/money";
import { assertHttpsInProduction, normalizeBaseUrl } from "../utils/url";
import { createStoreOrder } from "./orders.service";
import { registerCouponRedemption, validateCoupon } from "./coupons.service";
import { grantCashbackForOrder } from "./cashback.service";
import { refreshCustomerMetrics } from "./customers.service";
import { CouponModel } from "../models/Coupon";
import { CashbackLedgerModel } from "../models/CashbackLedger";

type CartIdentity = { customerId?: string; guestToken?: string };

function requireMercadoPagoAccessToken() {
  const token = env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    throw new ApiError(
      500,
      "Mercado Pago não configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no backend.",
      "MERCADOPAGO_NOT_CONFIGURED",
    );
  }
  return token;
}

function requireStoreUrl() {
  const storeUrl = env.STORE_URL;
  if (!storeUrl) {
    throw new ApiError(500, "STORE_URL não configurada no backend.", "STORE_URL_NOT_CONFIGURED");
  }

  const normalized = normalizeBaseUrl(storeUrl, "STORE_URL");
  assertHttpsInProduction(normalized, "STORE_URL");
  return normalized;
}

function mpClient() {
  return new MercadoPagoConfig({ accessToken: requireMercadoPagoAccessToken() });
}

async function getActiveCart(identity: CartIdentity) {
  const query: Record<string, unknown> = { status: "active" };

  if (identity.customerId) query.customerId = new Types.ObjectId(identity.customerId);
  else if (identity.guestToken) query.guestToken = identity.guestToken;
  else throw new ApiError(401, "Carrinho não identificado.", "AUTH_REQUIRED");

  const cart = await CartModel.findOne(query);
  if (!cart || !cart.items.length) throw new ApiError(400, "Carrinho sem itens.");
  return cart;
}

async function revertOrderStock(order: any) {
  for (const item of order.items || []) {
    const productId = String(item.productId || "");
    if (!Types.ObjectId.isValid(productId)) continue;

    const product = await ProductModel.findById(productId);
    if (!product) continue;

    const qty = Math.max(1, Math.floor(Number(item.qty || 1)));
    const sizeLabel = item.sizeLabel ? String(item.sizeLabel).trim() : undefined;

    if (sizeLabel && Array.isArray(product.sizes) && product.sizes.length > 0) {
      const normalized = sizeLabel.toLocaleLowerCase("pt-BR");
      const idx = product.sizes.findIndex(
        (entry: any) => String(entry?.label || "").trim().toLocaleLowerCase("pt-BR") === normalized,
      );

      if (idx >= 0) {
        const current = Math.max(0, Math.floor(Number(product.sizes[idx]?.stock ?? 0)));
        product.sizes[idx]!.stock = current + qty;
      }

      product.stock = product.sizes.reduce((acc: number, entry: any) => {
        const isActive = entry?.active === undefined ? true : Boolean(entry.active);
        const value = Math.max(0, Math.floor(Number(entry?.stock ?? 0)));
        return acc + (isActive ? value : 0);
      }, 0);
    } else {
      product.stock = Math.max(0, Math.floor(Number(product.stock ?? 0))) + qty;
    }

    await product.save();

    await InventoryMovementModel.create({
      productId: product._id,
      type: "liberacao",
      quantity: qty,
      reason: `Cancelamento do pedido ${order.code}`,
      createdBy: "sistema",
      sizeLabel,
    });
  }
}

async function revertCouponRedemption(order: any) {
  const couponCode = order.couponCode ? String(order.couponCode).trim().toUpperCase() : "";
  if (!couponCode) return;

  const coupon = await CouponModel.findOne({ code: couponCode });
  if (!coupon) return;

  const orderId = String(order._id);
  const before = coupon.redemptions.length;
  coupon.redemptions = coupon.redemptions.filter((row: any) => String(row.orderId) !== orderId);

  const removed = before - coupon.redemptions.length;
  if (removed > 0) {
    coupon.uses = Math.max(0, Math.floor(Number(coupon.uses || 0)) - removed);
    await coupon.save();
  }
}

async function revertCashbackGrant(order: any) {
  const customerId = order.customerId ? String(order.customerId) : "";
  const granted = Math.max(0, Math.floor(Number(order.cashbackGrantedCents || 0)));
  if (!customerId || granted <= 0) return;

  const exists = await CashbackLedgerModel.findOne({ customerId, orderId: order._id, type: "credit" });
  if (!exists) return;

  const last = await CashbackLedgerModel.findOne({ customerId }).sort({ createdAt: -1 });
  const current = last?.balanceAfterCents || 0;
  const balanceAfter = Math.max(0, current - granted);

  await CashbackLedgerModel.create({
    customerId: new Types.ObjectId(customerId),
    orderId: order._id,
    type: "debit",
    amountCents: -granted,
    balanceAfterCents: balanceAfter,
    note: `Reversão de cashback do pedido ${order.code}`,
  });

  order.cashbackGrantedCents = 0;
}

async function ensureCouponRegisteredForPaidOrder(order: any) {
  const couponCode = order.couponCode ? String(order.couponCode).trim().toUpperCase() : "";
  if (!couponCode) return;
  const discountCents = Math.max(0, Math.floor(Number(order.discountCents || 0)));
  if (discountCents <= 0) return;

  const coupon = await CouponModel.findOne({ code: couponCode });
  if (!coupon) return;

  const orderId = String(order._id);
  const already = coupon.redemptions.some((row: any) => String(row.orderId) === orderId);
  if (already) return;

  await registerCouponRedemption({
    couponCode,
    orderId,
    customerId: order.customerId ? String(order.customerId) : undefined,
    discountCents,
  });
}

async function ensureCashbackGrantedForPaidOrder(order: any) {
  if (!order.customerId) return;

  const already = await CashbackLedgerModel.findOne({ customerId: order.customerId, orderId: order._id, type: "credit" });
  if (already) return;

  const result = await grantCashbackForOrder({
    customerId: String(order.customerId),
    orderId: String(order._id),
    subtotalCents: order.subtotalCents,
  });

  if (result.grantedCents > 0) {
    order.cashbackGrantedCents = result.grantedCents;
  }
}

export async function createMercadoPagoCheckoutPro(input: {
  identity: CartIdentity;
  shippingMethodId?: string;
  shippingMethod?: string;
  couponCode?: string;
  cashbackUsedCents?: number;
  address: {
    fullName: string;
    email: string;
    phone: string;
    zip: string;
    state: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    complement?: string;
  };
}) {
  const storeUrl = requireStoreUrl();
  const cart = await getActiveCart(input.identity);

  const items = cart.items.map((item: any) => ({
    id: String(item.productId),
    qty: Number(item.qty || 1),
    variant: item.variant,
    sizeLabel: item.sizeLabel,
  }));

  const couponCode = input.couponCode || cart.couponCode || undefined;

  const orderOutput = await createStoreOrder({
    customerId: input.identity.customerId,
    // Não converter o carrinho agora; o usuário pode voltar e tentar novamente.
    cartId: undefined,
    channel: "Site",
    shippingMethod: input.shippingMethodId || input.shippingMethod || "sul-fluminense",
    paymentMethod: "Mercado Pago",
    couponCode,
    cashbackUsedCents: input.cashbackUsedCents,
    items,
    address: input.address,
    finalize: false,
  });

  const order = await OrderModel.findById(orderOutput.id);
  if (!order) throw new ApiError(500, "Falha ao criar pedido.");

  // Valida cupom novamente para garantir consistência de desconto (sem registrar uso ainda).
  if (order.couponCode && order.discountCents > 0) {
    await validateCoupon(order.couponCode, order.subtotalCents);
  }

  const cancelToken = randomUUID();

  const preference = new Preference(mpClient());

  let preferenceResult: unknown;
  try {
    preferenceResult = await preference.create({
      body: {
        items: [
          {
            id: `order-${order.code}`,
            title: `Pedido ${order.code}`,
            quantity: 1,
            unit_price: fromCents(order.totalCents),
            currency_id: "BRL",
          },
        ],
        payer: {
          email: order.email,
        },
        external_reference: String(order._id),
        back_urls: {
          success: `${storeUrl}/checkout/success`,
          failure: `${storeUrl}/checkout/failure`,
          pending: `${storeUrl}/checkout/pending`,
        },
        auto_return: "approved",
        metadata: {
          orderId: String(order._id),
          orderCode: order.code,
        },
      },
    });
  } catch {
    order.status = "cancelado";
    order.paymentStatus = "cancelled";
    order.cancelledAt = new Date();
    await revertOrderStock(order);
    await order.save();

    throw new ApiError(
      502,
      "Não foi possível iniciar o Checkout Pro do Mercado Pago.",
      "MERCADOPAGO_PREFERENCE_FAILED",
    );
  }

  const initPoint = (preferenceResult as any)?.init_point as string | undefined;
  const preferenceId = (preferenceResult as any)?.id as string | undefined;

  if (!initPoint || !preferenceId) {
    throw new ApiError(502, "Não foi possível iniciar o Checkout Pro do Mercado Pago.", "MERCADOPAGO_PREFERENCE_FAILED");
  }

  await PaymentTransactionModel.create({
    provider: "mercadopago",
    orderId: order._id,
    preferenceId,
    status: "initiated",
    cancelToken,
  });

  order.paymentProvider = "mercadopago";
  order.paymentPreferenceId = preferenceId;
  order.paymentStatus = "initiated";
  await order.save();

  return {
    initPoint,
    preferenceId,
    orderId: String(order._id),
    cancelToken,
  };
}

export async function verifyMercadoPagoPayment(input: {
  paymentId: string;
  externalReference?: string;
  merchantOrderId?: string;
}) {
  const paymentId = String(input.paymentId || "").trim();
  if (!paymentId) throw new ApiError(400, "payment_id inválido.", "VALIDATION_ERROR");

  const paymentClient = new Payment(mpClient());
  const paymentResult = await paymentClient.get({ id: paymentId });

  const payment: any = (paymentResult as any) || {};
  const status = String(payment.status || "").trim() || "unknown";
  const externalReference = String(payment.external_reference || input.externalReference || "").trim();

  if (!externalReference || !Types.ObjectId.isValid(externalReference)) {
    throw new ApiError(400, "external_reference inválido.", "VALIDATION_ERROR");
  }

  const order = await OrderModel.findById(externalReference);
  if (!order) throw new ApiError(404, "Pedido não encontrado.");

  // Segurança: se o retorno trouxe external_reference diferente do esperado, bloqueia.
  if (input.externalReference && String(input.externalReference).trim() !== String(order._id)) {
    throw new ApiError(400, "external_reference não confere com o pedido.", "VALIDATION_ERROR");
  }

  const tx = await PaymentTransactionModel.findOne({ provider: "mercadopago", orderId: order._id }).sort({ createdAt: -1 });
  if (tx) {
    tx.paymentId = paymentId;
    if (input.merchantOrderId) tx.merchantOrderId = input.merchantOrderId;
    tx.raw = payment;
    tx.status =
      status === "approved"
        ? "approved"
        : status === "pending"
          ? "pending"
          : status === "rejected" || status === "cancelled"
            ? "rejected"
            : tx.status;
    await tx.save();
  }

  order.paymentProvider = "mercadopago";
  order.paymentId = paymentId;
  order.paymentStatus = status;

  if (status === "approved") {
    const wasPaid = order.status === "pago" || order.status === "separacao" || order.status === "enviado" || order.status === "entregue";
    if (!wasPaid) {
      order.status = "pago";
      order.paidAt = payment.date_approved ? new Date(payment.date_approved) : new Date();
    }

    await ensureCouponRegisteredForPaidOrder(order);
    await ensureCashbackGrantedForPaidOrder(order);

    if (order.customerId) {
      await refreshCustomerMetrics(String(order.customerId));
    }
  }

  await order.save();

  return {
    ok: true as const,
    orderId: String(order._id),
    orderStatus: order.status,
    paymentStatus: status,
  };
}

export async function cancelMercadoPagoOrder(input: { orderId: string; cancelToken: string }) {
  const orderId = String(input.orderId || "").trim();
  const cancelToken = String(input.cancelToken || "").trim();

  if (!Types.ObjectId.isValid(orderId)) throw new ApiError(400, "orderId inválido.", "VALIDATION_ERROR");
  if (!cancelToken) throw new ApiError(400, "cancelToken inválido.", "VALIDATION_ERROR");

  const tx = await PaymentTransactionModel.findOne({
    provider: "mercadopago",
    orderId: new Types.ObjectId(orderId),
    cancelToken,
  }).sort({ createdAt: -1 });

  if (!tx) throw new ApiError(403, "Sem permissão para cancelar este pedido.", "FORBIDDEN");

  const order = await OrderModel.findById(orderId);
  if (!order) throw new ApiError(404, "Pedido não encontrado.");

  if (order.status !== "pendente") {
    return { ok: true as const };
  }

  order.status = "cancelado";
  order.paymentStatus = "cancelled";
  order.cancelledAt = new Date();

  tx.status = "cancelled";
  await tx.save();

  await revertOrderStock(order);
  await revertCouponRedemption(order);
  await revertCashbackGrant(order);

  if (order.customerId) {
    await refreshCustomerMetrics(String(order.customerId));
  }

  await order.save();

  return { ok: true as const };
}

export async function getMercadoPagoPaymentDebug(paymentId: string) {
  const id = String(paymentId || "").trim();
  if (!id) throw new ApiError(400, "paymentId inválido.", "VALIDATION_ERROR");

  const paymentClient = new Payment(mpClient());
  const paymentResult = await paymentClient.get({ id });
  return paymentResult as unknown;
}
