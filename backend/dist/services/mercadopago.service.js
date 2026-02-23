"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMercadoPagoCheckoutPro = createMercadoPagoCheckoutPro;
exports.verifyMercadoPagoPayment = verifyMercadoPagoPayment;
exports.cancelMercadoPagoOrder = cancelMercadoPagoOrder;
exports.getMercadoPagoPaymentDebug = getMercadoPagoPaymentDebug;
const crypto_1 = require("crypto");
const mercadopago_1 = require("mercadopago");
const prisma_1 = require("../lib/prisma");
const env_1 = require("../config/env");
const apiError_1 = require("../utils/apiError");
const money_1 = require("../utils/money");
const url_1 = require("../utils/url");
const orders_service_1 = require("./orders.service");
const cashback_service_1 = require("./cashback.service");
const customers_service_1 = require("./customers.service");
const coupons_service_1 = require("./coupons.service");
const products_service_1 = require("./products.service");
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function asObj(value) {
    return value && typeof value === "object" ? value : null;
}
function requireMercadoPagoAccessToken() {
    const token = env_1.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
        throw new apiError_1.ApiError(500, "Mercado Pago não configurado. Defina MERCADO_PAGO_ACCESS_TOKEN no backend.", "MERCADOPAGO_NOT_CONFIGURED");
    }
    return token;
}
function requireStoreUrl() {
    const storeUrl = env_1.env.STORE_URL;
    if (!storeUrl) {
        throw new apiError_1.ApiError(500, "STORE_URL não configurada no backend.", "STORE_URL_NOT_CONFIGURED");
    }
    return (0, url_1.buildStoreRedirectUrls)(storeUrl);
}
function resolveNotificationUrl() {
    const rawBase = String(env_1.env.API_PUBLIC_URL || "").trim();
    if (!rawBase)
        return undefined;
    try {
        const base = (0, url_1.normalizeBaseUrl)(rawBase, "API_PUBLIC_URL");
        const host = new URL(base).hostname.toLowerCase();
        if ((host === "localhost" || host === "127.0.0.1") && env_1.env.NODE_ENV !== "production")
            return undefined;
        return `${base}/api/v1/payments/mercadopago/webhook`;
    }
    catch {
        return undefined;
    }
}
function mpClient() {
    return new mercadopago_1.MercadoPagoConfig({ accessToken: requireMercadoPagoAccessToken() });
}
function parseOrderItems(order) {
    return asArray(order.items).map((row, index) => {
        const item = asObj(row) || {};
        return {
            id: String(item.productId || item.id || `item-${index}`),
            name: String(item.name || "Produto"),
            qty: Math.max(1, Math.floor(Number(item.qty || 1))),
            unitPriceCents: Math.max(0, Math.floor(Number(item.unitPriceCents || 0))),
            totalCents: Math.max(0, Math.floor(Number(item.totalCents || 0))),
            sizeLabel: item.sizeLabel ? String(item.sizeLabel) : undefined,
        };
    });
}
function buildPreferenceItemsFromOrder(order) {
    const subtotalCents = Math.max(0, Math.floor(Number(order.subtotalCents || 0)));
    const discountCents = Math.max(0, Math.floor(Number(order.discountCents || 0)));
    const shippingCents = Math.max(0, Math.floor(Number(order.shippingCents || 0)));
    const taxCents = Math.max(0, Math.floor(Number(order.taxCents || 0)));
    const taxableCents = Math.max(0, subtotalCents - discountCents);
    const lines = parseOrderItems(order).map((item) => ({ item, qty: item.qty, baseTotalCents: item.totalCents }));
    const allocatedTotals = [];
    if (subtotalCents <= 0 || discountCents <= 0) {
        for (const line of lines)
            allocatedTotals.push(line.baseTotalCents);
    }
    else {
        let sum = 0;
        for (const line of lines) {
            const value = Math.floor((line.baseTotalCents * taxableCents) / subtotalCents);
            allocatedTotals.push(value);
            sum += value;
        }
        let remainder = taxableCents - sum;
        for (let i = 0; i < allocatedTotals.length && remainder > 0; i += 1) {
            allocatedTotals[i] = allocatedTotals[i] + 1;
            remainder -= 1;
        }
    }
    const items = [];
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const lineTotalCents = Math.max(0, Math.floor(Number(allocatedTotals[index] ?? 0)));
        const title = line.item.sizeLabel ? `${line.item.name} (${line.item.sizeLabel})` : line.item.name;
        const qty = line.qty;
        const unitBaseCents = Math.floor(lineTotalCents / qty);
        const remainder = lineTotalCents - unitBaseCents * qty;
        const baseQty = qty - remainder;
        if (baseQty > 0 && unitBaseCents > 0) {
            items.push({
                id: line.item.id,
                title,
                quantity: baseQty,
                unit_price: (0, money_1.fromCents)(unitBaseCents),
                currency_id: "BRL",
            });
        }
        if (remainder > 0) {
            items.push({
                id: line.item.id,
                title,
                quantity: remainder,
                unit_price: (0, money_1.fromCents)(unitBaseCents + 1),
                currency_id: "BRL",
            });
        }
    }
    const shippingAndTaxCents = shippingCents + taxCents;
    if (shippingAndTaxCents > 0) {
        const method = order.shippingMethod ? String(order.shippingMethod).trim() : "";
        items.push({
            id: "shipping",
            title: method ? `Frete (${method})` : "Frete",
            quantity: 1,
            unit_price: (0, money_1.fromCents)(shippingAndTaxCents),
            currency_id: "BRL",
        });
    }
    return items;
}
async function getActiveCart(identity) {
    if (!identity.customerId && !identity.guestToken) {
        throw new apiError_1.ApiError(401, "Carrinho não identificado.", "AUTH_REQUIRED");
    }
    const cart = await prisma_1.prisma.cart.findFirst({
        where: {
            status: "active",
            ...(identity.customerId ? { customerId: identity.customerId } : { guestToken: identity.guestToken }),
        },
        orderBy: { updatedAt: "desc" },
    });
    if (!cart || !asArray(cart.items).length) {
        throw new apiError_1.ApiError(400, "Carrinho sem itens.");
    }
    return cart;
}
function parseProductSizes(product) {
    return asArray(product.sizes)
        .map((entry) => {
        const row = asObj(entry);
        if (!row)
            return null;
        const label = String(row.label || "").trim();
        if (!label)
            return null;
        return {
            label,
            stock: Math.max(0, Math.floor(Number(row.stock ?? 0))),
            active: row.active === undefined ? true : Boolean(row.active),
        };
    })
        .filter((row) => row !== null);
}
async function revertOrderStock(order) {
    const touched = new Map();
    const rows = parseOrderItems(order);
    await prisma_1.prisma.$transaction(async (tx) => {
        for (const item of rows) {
            const productId = String(item.id || "").trim();
            if (!productId)
                continue;
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product)
                continue;
            const qty = Math.max(1, Math.floor(Number(item.qty || 1)));
            const rawSizeLabel = item.sizeLabel ? String(item.sizeLabel).trim() : "";
            const sizes = parseProductSizes(product);
            let nextStock = Math.max(0, Math.floor(Number(product.stock || 0))) + qty;
            let nextSizes = product.sizes;
            if (rawSizeLabel && sizes.length) {
                const normalized = rawSizeLabel.toLocaleLowerCase("pt-BR");
                const idx = sizes.findIndex((entry) => entry.label.toLocaleLowerCase("pt-BR") === normalized);
                if (idx >= 0) {
                    sizes[idx] = { ...sizes[idx], stock: Math.max(0, sizes[idx].stock) + qty };
                }
                nextSizes = sizes;
                nextStock = sizes.reduce((acc, entry) => acc + (entry.active ? Math.max(0, entry.stock) : 0), 0);
            }
            await tx.product.update({
                where: { id: product.id },
                data: { stock: nextStock, sizes: nextSizes },
            });
            await tx.inventoryMovement.create({
                data: {
                    productId: product.id,
                    type: "liberacao",
                    quantity: qty,
                    reason: `Cancelamento do pedido ${order.code}`,
                    createdBy: "sistema",
                    sizeLabel: rawSizeLabel || undefined,
                },
            });
            touched.set(String(product.id), String(product.slug || ""));
        }
    });
    if (touched.size > 0) {
        await Promise.all(Array.from(touched.entries()).map(([id, slug]) => (0, products_service_1.invalidateProductCacheByIdentity)({ id, slug, bumpListVersion: false })));
        await (0, products_service_1.bumpProductsListVersion)();
    }
}
async function revertCouponRedemption(order) {
    const redemptions = await prisma_1.prisma.couponRedemption.findMany({
        where: { orderId: String(order.id) },
    });
    if (!redemptions.length)
        return;
    const grouped = new Map();
    for (const row of redemptions) {
        const key = String(row.couponId);
        grouped.set(key, (grouped.get(key) || 0) + 1);
    }
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.couponRedemption.deleteMany({ where: { orderId: String(order.id) } });
        for (const [couponId, count] of grouped.entries()) {
            const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
            if (!coupon)
                continue;
            const redemptionsJson = asArray(coupon.redemptions).filter((entry) => {
                const row = asObj(entry);
                return String(row?.orderId || "") !== String(order.id);
            });
            await tx.coupon.update({
                where: { id: coupon.id },
                data: {
                    uses: Math.max(0, Number(coupon.uses || 0) - count),
                    redemptions: redemptionsJson,
                },
            });
        }
    });
}
async function revertCashbackGrant(order) {
    const customerId = order.customerId ? String(order.customerId) : "";
    const granted = Math.max(0, Math.floor(Number(order.cashbackGrantedCents || 0)));
    if (!customerId || granted <= 0)
        return;
    const credit = await prisma_1.prisma.cashbackLedger.findFirst({
        where: { customerId, orderId: String(order.id), type: "credit" },
    });
    if (!credit)
        return;
    const last = await prisma_1.prisma.cashbackLedger.findFirst({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        select: { balanceAfterCents: true },
    });
    const current = Number(last?.balanceAfterCents || 0);
    const balanceAfter = Math.max(0, current - granted);
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.cashbackLedger.create({
            data: {
                customerId,
                orderId: String(order.id),
                type: "debit",
                amountCents: -granted,
                balanceAfterCents: balanceAfter,
                note: `Reversão de cashback do pedido ${order.code}`,
            },
        }),
        prisma_1.prisma.order.update({
            where: { id: String(order.id) },
            data: { cashbackGrantedCents: 0 },
        }),
    ]);
}
async function ensureCouponRegisteredForPaidOrder(order) {
    const couponCode = order.couponCode ? String(order.couponCode).trim().toUpperCase() : "";
    const discountCents = Math.max(0, Math.floor(Number(order.discountCents || 0)));
    if (!couponCode || discountCents <= 0)
        return;
    const exists = await prisma_1.prisma.couponRedemption.findFirst({
        where: { orderId: String(order.id) },
        select: { id: true },
    });
    if (exists)
        return;
    await (0, coupons_service_1.registerCouponRedemption)({
        couponCode,
        orderId: String(order.id),
        customerId: order.customerId ? String(order.customerId) : undefined,
        discountCents,
    });
}
async function ensureCashbackGrantedForPaidOrder(order) {
    if (!order.customerId)
        return;
    const customerId = String(order.customerId);
    const exists = await prisma_1.prisma.cashbackLedger.findFirst({
        where: { customerId, orderId: String(order.id), type: "credit" },
        select: { id: true },
    });
    if (exists)
        return;
    const result = await (0, cashback_service_1.grantCashbackForOrder)({
        customerId,
        orderId: String(order.id),
        subtotalCents: Number(order.subtotalCents || 0),
    });
    if (result.grantedCents > 0) {
        await prisma_1.prisma.order.update({
            where: { id: String(order.id) },
            data: { cashbackGrantedCents: result.grantedCents },
        });
    }
}
async function cancelPendingOrderAndRevert(order, paymentStatus) {
    await prisma_1.prisma.order.update({
        where: { id: String(order.id) },
        data: {
            status: "cancelado",
            paymentStatus,
            cancelledAt: new Date(),
        },
    });
    await revertOrderStock(order);
    await revertCouponRedemption(order);
    await revertCashbackGrant(order);
    if (order.customerId) {
        await (0, customers_service_1.refreshCustomerMetrics)(String(order.customerId));
    }
}
async function createMercadoPagoCheckoutPro(input) {
    const store = requireStoreUrl();
    const requestedOrderId = String(input.orderId || "").trim();
    let order = requestedOrderId ? await prisma_1.prisma.order.findUnique({ where: { id: requestedOrderId } }) : null;
    if (order && input.identity.customerId && String(order.customerId || "") !== String(input.identity.customerId)) {
        order = null;
    }
    if (order) {
        if (order.status !== "pendente") {
            throw new apiError_1.ApiError(400, "Este pedido não está pendente para pagamento.", "VALIDATION_ERROR");
        }
        if (order.paymentProvider === "mercadopago" && order.paymentPreferenceId) {
            const tx = await prisma_1.prisma.paymentTransaction.findFirst({
                where: { provider: "mercadopago", orderId: order.id },
                orderBy: { createdAt: "desc" },
            });
            return {
                preferenceId: String(order.paymentPreferenceId),
                orderId: String(order.id),
                cancelToken: tx?.cancelToken ? String(tx.cancelToken) : undefined,
            };
        }
    }
    else {
        const cart = await getActiveCart(input.identity);
        const items = asArray(cart.items).map((entry) => {
            const row = asObj(entry) || {};
            return {
                id: String(row.productId || ""),
                qty: Math.max(1, Math.floor(Number(row.qty || 1))),
                variant: row.variant ? String(row.variant) : undefined,
                sizeLabel: row.sizeLabel ? String(row.sizeLabel) : undefined,
            };
        });
        const couponCode = input.couponCode || cart.couponCode || undefined;
        const created = await (0, orders_service_1.createStoreOrder)({
            customerId: input.identity.customerId,
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
        order = await prisma_1.prisma.order.findUnique({ where: { id: created.id } });
    }
    if (!order)
        throw new apiError_1.ApiError(500, "Falha ao preparar pedido.");
    if (order.couponCode && Number(order.discountCents || 0) > 0) {
        await (0, coupons_service_1.validateCoupon)(String(order.couponCode), Number(order.subtotalCents || 0));
    }
    const cancelToken = (0, crypto_1.randomUUID)();
    const notificationUrl = resolveNotificationUrl();
    const preference = new mercadopago_1.Preference(mpClient());
    const mpItems = buildPreferenceItemsFromOrder(order);
    if (!mpItems.length) {
        throw new apiError_1.ApiError(400, "Pedido sem valor para pagamento.", "VALIDATION_ERROR");
    }
    let preferenceResult;
    try {
        preferenceResult = await preference.create({
            body: {
                items: mpItems,
                payer: { email: order.email },
                external_reference: String(order.id),
                back_urls: {
                    success: store.success,
                    failure: store.failure,
                    pending: store.pending,
                },
                auto_return: "approved",
                metadata: {
                    orderId: String(order.id),
                    orderCode: order.code,
                },
                ...(notificationUrl ? { notification_url: notificationUrl } : {}),
            },
        });
    }
    catch {
        if (order.status === "pendente") {
            await cancelPendingOrderAndRevert(order, "cancelled");
        }
        throw new apiError_1.ApiError(502, "Não foi possível iniciar o Checkout Pro do Mercado Pago.", "MERCADOPAGO_PREFERENCE_FAILED");
    }
    const preferenceId = preferenceResult?.id;
    if (!preferenceId) {
        throw new apiError_1.ApiError(502, "Não foi possível iniciar o Checkout Pro do Mercado Pago.", "MERCADOPAGO_PREFERENCE_FAILED");
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.paymentTransaction.create({
            data: {
                provider: "mercadopago",
                orderId: order.id,
                preferenceId,
                status: "initiated",
                cancelToken,
            },
        }),
        prisma_1.prisma.order.update({
            where: { id: order.id },
            data: {
                paymentProvider: "mercadopago",
                paymentPreferenceId: preferenceId,
                paymentStatus: "initiated",
            },
        }),
    ]);
    return { preferenceId, orderId: String(order.id), cancelToken };
}
async function verifyMercadoPagoPayment(input) {
    const paymentId = String(input.paymentId || "").trim();
    if (!paymentId)
        throw new apiError_1.ApiError(400, "payment_id inválido.", "VALIDATION_ERROR");
    const paymentClient = new mercadopago_1.Payment(mpClient());
    const paymentResult = await paymentClient.get({ id: paymentId });
    const payment = paymentResult || {};
    const status = String(payment.status || "").trim() || "unknown";
    const externalReference = String(payment.external_reference || input.externalReference || "").trim();
    if (!externalReference)
        throw new apiError_1.ApiError(400, "external_reference inválido.", "VALIDATION_ERROR");
    const order = await prisma_1.prisma.order.findUnique({ where: { id: externalReference } });
    if (!order)
        throw new apiError_1.ApiError(404, "Pedido não encontrado.");
    if (input.externalReference && String(input.externalReference).trim() !== String(order.id)) {
        throw new apiError_1.ApiError(400, "external_reference não confere com o pedido.", "VALIDATION_ERROR");
    }
    const tx = await prisma_1.prisma.paymentTransaction.findFirst({
        where: { provider: "mercadopago", orderId: order.id },
        orderBy: { createdAt: "desc" },
    });
    if (tx) {
        await prisma_1.prisma.paymentTransaction.update({
            where: { id: tx.id },
            data: {
                paymentId,
                merchantOrderId: input.merchantOrderId || tx.merchantOrderId,
                raw: payment,
                status: status === "approved"
                    ? "approved"
                    : status === "pending"
                        ? "pending"
                        : status === "rejected" || status === "cancelled"
                            ? "rejected"
                            : tx.status,
            },
        });
    }
    let nextOrderStatus = order.status;
    let paidAt = order.paidAt;
    if (status === "approved" && !["pago", "separacao", "enviado", "entregue"].includes(order.status)) {
        nextOrderStatus = "pago";
        paidAt = payment.date_approved ? new Date(payment.date_approved) : new Date();
    }
    await prisma_1.prisma.order.update({
        where: { id: order.id },
        data: {
            paymentProvider: "mercadopago",
            paymentId,
            paymentStatus: status,
            status: nextOrderStatus,
            paidAt,
        },
    });
    if (status === "approved") {
        const freshOrder = await prisma_1.prisma.order.findUnique({ where: { id: order.id } });
        if (!freshOrder)
            throw new apiError_1.ApiError(404, "Pedido não encontrado.");
        await ensureCouponRegisteredForPaidOrder(freshOrder);
        await ensureCashbackGrantedForPaidOrder(freshOrder);
        if (freshOrder.customerId)
            await (0, customers_service_1.refreshCustomerMetrics)(String(freshOrder.customerId));
    }
    else if ((status === "rejected" || status === "cancelled") && order.status === "pendente") {
        await cancelPendingOrderAndRevert(order, status === "rejected" ? "rejected" : "cancelled");
        if (tx) {
            await prisma_1.prisma.paymentTransaction.update({
                where: { id: tx.id },
                data: { status: status === "rejected" ? "rejected" : "cancelled" },
            });
        }
    }
    const refreshed = await prisma_1.prisma.order.findUnique({ where: { id: order.id } });
    return {
        ok: true,
        orderId: String(order.id),
        orderStatus: refreshed?.status || order.status,
        paymentStatus: status,
    };
}
async function cancelMercadoPagoOrder(input) {
    const orderId = String(input.orderId || "").trim();
    const cancelToken = String(input.cancelToken || "").trim();
    if (!orderId)
        throw new apiError_1.ApiError(400, "orderId inválido.", "VALIDATION_ERROR");
    if (!cancelToken)
        throw new apiError_1.ApiError(400, "cancelToken inválido.", "VALIDATION_ERROR");
    const tx = await prisma_1.prisma.paymentTransaction.findFirst({
        where: { provider: "mercadopago", orderId, cancelToken },
        orderBy: { createdAt: "desc" },
    });
    if (!tx)
        throw new apiError_1.ApiError(403, "Sem permissão para cancelar este pedido.", "FORBIDDEN");
    const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new apiError_1.ApiError(404, "Pedido não encontrado.");
    if (order.status !== "pendente")
        return { ok: true };
    await prisma_1.prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: { status: "cancelled" },
    });
    await cancelPendingOrderAndRevert(order, "cancelled");
    return { ok: true };
}
async function getMercadoPagoPaymentDebug(paymentId) {
    const id = String(paymentId || "").trim();
    if (!id)
        throw new apiError_1.ApiError(400, "paymentId inválido.", "VALIDATION_ERROR");
    const paymentClient = new mercadopago_1.Payment(mpClient());
    return (await paymentClient.get({ id }));
}
