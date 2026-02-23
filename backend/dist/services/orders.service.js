"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminOrders = listAdminOrders;
exports.getAdminOrderById = getAdminOrderById;
exports.updateOrderStatus = updateOrderStatus;
exports.listMeOrders = listMeOrders;
exports.getMeOrderById = getMeOrderById;
exports.createStoreOrder = createStoreOrder;
exports.createOrderFromCart = createOrderFromCart;
exports.toOrder = toOrder;
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
const coupons_service_1 = require("./coupons.service");
const cashback_service_1 = require("./cashback.service");
const customers_service_1 = require("./customers.service");
const carts_service_1 = require("./carts.service");
const products_service_1 = require("./products.service");
function normalizeSizes(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((raw) => {
        if (!raw || typeof raw !== "object")
            return null;
        const row = raw;
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
function toOrder(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    return {
        id: String(order.id),
        code: order.code,
        customerId: order.customerId ? String(order.customerId) : undefined,
        customerName: order.customerName,
        email: order.email,
        itemsCount: order.itemsCount,
        total: (0, money_1.fromCents)(order.totalCents),
        status: order.status,
        channel: order.channel,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt?.toISOString(),
        items: items.map((item, index) => ({
            id: String(item?.id || item?._id || `${index}`),
            name: item?.name,
            sku: item?.sku,
            qty: Number(item?.qty || 0),
            unitPrice: (0, money_1.fromCents)(Number(item?.unitPriceCents || 0)),
            total: (0, money_1.fromCents)(Number(item?.totalCents || 0)),
        })),
        totals: {
            subtotal: (0, money_1.fromCents)(order.subtotalCents),
            discount: (0, money_1.fromCents)(order.discountCents),
            shipping: (0, money_1.fromCents)(order.shippingCents),
            tax: (0, money_1.fromCents)(order.taxCents),
            total: (0, money_1.fromCents)(order.totalCents),
            subtotalCents: order.subtotalCents,
            discountCents: order.discountCents,
            shippingCents: order.shippingCents,
            taxCents: order.taxCents,
            totalCents: order.totalCents,
        },
        address: {
            fullName: order.address?.fullName,
            email: order.address?.email,
            phone: order.address?.phone,
            zip: order.address?.zip,
            state: order.address?.state,
            city: order.address?.city,
            neighborhood: order.address?.neighborhood,
            street: order.address?.street,
            number: order.address?.number,
            complement: order.address?.complement,
        },
    };
}
async function nextOrderCode() {
    const count = await prisma_1.prisma.order.count();
    return String(10000 + count + 1);
}
const FREE_SHIPPING_THRESHOLD_CENTS = 29900;
const SHIPPING_METHODS = {
    "sul-fluminense": {
        id: "sul-fluminense",
        label: "Envio r�pido Sul Fluminense",
        priceCents: 1290,
    },
    "padrao-br": {
        id: "padrao-br",
        label: "Envio padr�o nacional",
        priceCents: 1990,
    },
    expresso: {
        id: "expresso",
        label: "Envio expresso",
        priceCents: 2990,
    },
};
function resolveShippingMethod(raw) {
    const input = String(raw || "").trim();
    if (!input)
        return null;
    const byId = SHIPPING_METHODS[input];
    if (byId)
        return byId;
    const normalized = input.toLocaleLowerCase("pt-BR");
    const byLabel = Object.values(SHIPPING_METHODS).find((method) => method.label.toLocaleLowerCase("pt-BR") === normalized);
    return byLabel || null;
}
async function listAdminOrders(input) {
    const where = {};
    if (input.q) {
        where.OR = [
            { code: { contains: input.q, mode: "insensitive" } },
            { customerName: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
        ];
    }
    if (input.status && input.status !== "all")
        where.status = input.status;
    const [rows, total] = await Promise.all([
        prisma_1.prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.order.count({ where }),
    ]);
    return {
        data: rows.map(toOrder),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getAdminOrderById(id) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id } });
    if (!order)
        throw new apiError_1.ApiError(404, "Pedido n�o encontrado.");
    return toOrder(order);
}
async function updateOrderStatus(id, status) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id } });
    if (!order)
        throw new apiError_1.ApiError(404, "Pedido n�o encontrado.");
    const updated = await prisma_1.prisma.order.update({
        where: { id },
        data: { status },
    });
    return toOrder(updated);
}
async function listMeOrders(customerId, input) {
    const [rows, total] = await Promise.all([
        prisma_1.prisma.order.findMany({
            where: { customerId },
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.order.count({ where: { customerId } }),
    ]);
    return {
        data: rows.map(toOrder),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getMeOrderById(customerId, orderId) {
    const order = await prisma_1.prisma.order.findFirst({ where: { id: orderId, customerId } });
    if (!order)
        throw new apiError_1.ApiError(404, "Pedido n�o encontrado.");
    return toOrder(order);
}
async function createStoreOrder(input) {
    if (!input.items.length)
        throw new apiError_1.ApiError(400, "Pedido sem itens.");
    const finalize = input.finalize ?? true;
    const productIds = Array.from(new Set(input.items.map((item) => item.id)));
    const products = await prisma_1.prisma.product.findMany({
        where: { id: { in: productIds }, active: true },
    });
    if (products.length !== productIds.length) {
        throw new apiError_1.ApiError(400, "Um ou mais produtos do pedido n�o foram encontrados.");
    }
    const productMap = new Map(products.map((p) => [p.id, p]));
    const mutableStock = new Map();
    for (const p of products) {
        mutableStock.set(p.id, {
            stock: Math.max(0, Math.floor(Number(p.stock ?? 0))),
            sizes: normalizeSizes(p.sizes),
            sizeType: p.sizeType || "unico",
        });
    }
    const itemRows = [];
    for (const requested of input.items) {
        const product = productMap.get(requested.id);
        if (!product)
            throw new apiError_1.ApiError(400, "Produto inv�lido no pedido.");
        const qty = Math.max(1, Math.floor(requested.qty));
        const stockState = mutableStock.get(product.id);
        const hasSizes = stockState.sizeType !== "unico" && stockState.sizes.length > 0;
        let sizeLabel;
        let availableStock = stockState.stock;
        if (hasSizes) {
            const rawLabel = String(requested.sizeLabel || "").trim();
            if (!rawLabel) {
                throw new apiError_1.ApiError(400, `Selecione um tamanho para ${product.name}.`);
            }
            const normalized = rawLabel.toLocaleLowerCase("pt-BR");
            const idx = stockState.sizes.findIndex((entry) => {
                const label = String(entry?.label || "").trim();
                const active = entry?.active === undefined ? true : Boolean(entry.active);
                return active && label.toLocaleLowerCase("pt-BR") === normalized;
            });
            if (idx === -1)
                throw new apiError_1.ApiError(400, `Tamanho inv�lido para ${product.name}.`);
            sizeLabel = String(stockState.sizes[idx].label || rawLabel).trim();
            availableStock = Math.max(0, Math.floor(Number(stockState.sizes[idx]?.stock ?? 0)));
            if (availableStock < qty) {
                throw new apiError_1.ApiError(400, `Estoque insuficiente para ${product.name} (${sizeLabel}).`);
            }
            stockState.sizes[idx] = {
                ...stockState.sizes[idx],
                stock: availableStock - qty,
            };
            stockState.stock = stockState.sizes.reduce((acc, entry) => {
                const isActive = entry.active === undefined ? true : Boolean(entry.active);
                return acc + (isActive ? Math.max(0, entry.stock) : 0);
            }, 0);
        }
        else {
            if (stockState.stock < qty) {
                throw new apiError_1.ApiError(400, `Estoque insuficiente para ${product.name}.`);
            }
            stockState.stock -= qty;
        }
        const totalCents = product.priceCents * qty;
        itemRows.push({
            product,
            payload: {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                qty,
                unitPriceCents: product.priceCents,
                totalCents,
                variant: requested.variant,
                sizeLabel,
                slug: product.slug,
            },
        });
    }
    const subtotalCents = itemRows.reduce((acc, row) => acc + row.payload.totalCents, 0);
    let discountCents = 0;
    if (input.couponCode) {
        const validation = await (0, coupons_service_1.validateCoupon)(input.couponCode, subtotalCents);
        discountCents = validation.discountCents;
    }
    const shippingMethod = resolveShippingMethod(input.shippingMethod);
    const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : shippingMethod?.priceCents ?? 1290;
    const taxable = Math.max(0, subtotalCents - discountCents);
    const taxCents = Math.round(taxable * 0.08);
    const totalCents = taxable + shippingCents + taxCents;
    const code = await nextOrderCode();
    const touchedProducts = new Map();
    const created = await prisma_1.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
            data: {
                code,
                customerId: input.customerId || null,
                customerName: input.address.fullName,
                email: input.address.email.toLowerCase(),
                status: "pendente",
                channel: input.channel || "Site",
                shippingMethod: shippingMethod?.label || input.shippingMethod || "Padr�o",
                paymentMethod: input.paymentMethod || "Pix",
                items: itemRows.map((row) => row.payload),
                itemsCount: itemRows.reduce((acc, row) => acc + row.payload.qty, 0),
                subtotalCents,
                discountCents,
                shippingCents,
                taxCents,
                totalCents,
                couponCode: input.couponCode?.toUpperCase(),
                cashbackUsedCents: input.cashbackUsedCents || 0,
                address: input.address,
                orderItems: {
                    create: itemRows.map((row) => ({
                        productId: row.product.id,
                        name: row.payload.name,
                        sku: row.payload.sku,
                        qty: row.payload.qty,
                        unitPriceCents: row.payload.unitPriceCents,
                        totalCents: row.payload.totalCents,
                        variant: row.payload.variant,
                        sizeLabel: row.payload.sizeLabel,
                        slug: row.payload.slug,
                    })),
                },
            },
        });
        for (const row of itemRows) {
            const stockState = mutableStock.get(row.product.id);
            await tx.product.update({
                where: { id: row.product.id },
                data: {
                    stock: stockState.stock,
                    sizes: stockState.sizes,
                },
            });
            touchedProducts.set(row.product.id, String(row.product.slug || ""));
            await tx.inventoryMovement.create({
                data: {
                    productId: row.product.id,
                    type: "saida",
                    quantity: -Math.max(1, Math.floor(Number(row.payload.qty))),
                    reason: `Pedido ${code}`,
                    createdBy: input.customerId || "sistema",
                    sizeLabel: row.payload.sizeLabel,
                },
            });
        }
        return order;
    });
    if (touchedProducts.size > 0) {
        await Promise.all(Array.from(touchedProducts.entries()).map(([id, slug]) => (0, products_service_1.invalidateProductCacheByIdentity)({
            id,
            slug,
            bumpListVersion: false,
        })));
        await (0, products_service_1.bumpProductsListVersion)();
    }
    if (finalize) {
        if (input.couponCode && discountCents > 0) {
            await (0, coupons_service_1.registerCouponRedemption)({
                couponCode: input.couponCode,
                orderId: String(created.id),
                customerId: input.customerId,
                discountCents,
            });
        }
        const cashback = await (0, cashback_service_1.grantCashbackForOrder)({
            customerId: input.customerId,
            orderId: String(created.id),
            subtotalCents,
        });
        if (cashback.grantedCents > 0) {
            await prisma_1.prisma.order.update({
                where: { id: created.id },
                data: { cashbackGrantedCents: cashback.grantedCents },
            });
        }
        if (input.customerId) {
            await (0, customers_service_1.refreshCustomerMetrics)(input.customerId);
        }
        if (input.cartId) {
            await (0, carts_service_1.markCartConverted)(input.cartId);
        }
    }
    const fresh = await prisma_1.prisma.order.findUnique({ where: { id: created.id } });
    if (!fresh)
        throw new apiError_1.ApiError(500, "Falha ao carregar pedido criado.");
    return toOrder(fresh);
}
async function createOrderFromCart(cartId) {
    const cart = await prisma_1.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart)
        throw new apiError_1.ApiError(404, "Carrinho n�o encontrado.");
    const items = Array.isArray(cart.items) ? cart.items : [];
    if (!items.length)
        throw new apiError_1.ApiError(400, "Carrinho sem itens.");
    const order = await createStoreOrder({
        customerId: cart.customerId || undefined,
        cartId: String(cart.id),
        channel: "Site",
        shippingMethod: "Padr�o",
        paymentMethod: "Pix",
        couponCode: cart.couponCode || undefined,
        items: items.map((item) => ({
            id: String(item.productId),
            qty: Number(item.qty || 1),
            variant: item.variant,
            sizeLabel: item.sizeLabel,
        })),
        address: {
            fullName: "Cliente",
            email: "cliente@exemplo.com",
            phone: "",
            zip: "",
            state: "",
            city: "",
            neighborhood: "",
            street: "",
            number: "",
            complement: "",
        },
    });
    return order;
}
