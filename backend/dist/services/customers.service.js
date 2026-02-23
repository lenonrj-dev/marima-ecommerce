"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminCustomers = listAdminCustomers;
exports.getAdminCustomerById = getAdminCustomerById;
exports.updateAdminCustomer = updateAdminCustomer;
exports.listAdminCustomerOrders = listAdminCustomerOrders;
exports.getMeProfile = getMeProfile;
exports.patchMeProfile = patchMeProfile;
exports.listMeAddresses = listMeAddresses;
exports.createMeAddress = createMeAddress;
exports.updateMeAddress = updateMeAddress;
exports.deleteMeAddress = deleteMeAddress;
exports.listMeFavorites = listMeFavorites;
exports.addMeFavorite = addMeFavorite;
exports.removeMeFavorite = removeMeFavorite;
exports.refreshCustomerMetrics = refreshCustomerMetrics;
exports.getMeCashbackBalance = getMeCashbackBalance;
exports.createCustomerFromGuest = createCustomerFromGuest;
exports.toCustomer = toCustomer;
exports.toOrder = toOrder;
exports.toAddress = toAddress;
exports.toFavorite = toFavorite;
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
const auth_service_1 = require("./auth.service");
function toCustomer(customer) {
    return {
        id: String(customer.id),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        segment: customer.segment,
        ordersCount: customer.ordersCount,
        totalSpent: (0, money_1.fromCents)(customer.totalSpentCents),
        lastOrderAt: customer.lastOrderAt ? customer.lastOrderAt.toISOString() : undefined,
        createdAt: customer.createdAt?.toISOString(),
        tags: Array.isArray(customer.tags) ? customer.tags : [],
    };
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
    };
}
function toAddress(address) {
    return {
        id: String(address.id),
        label: address.label,
        fullName: address.fullName,
        zip: address.zip,
        state: address.state,
        city: address.city,
        neighborhood: address.neighborhood,
        street: address.street,
        number: address.number,
        complement: address.complement,
        isDefault: address.isDefault,
        createdAt: address.createdAt?.toISOString(),
        updatedAt: address.updatedAt?.toISOString(),
    };
}
function toFavorite(favorite) {
    return {
        id: String(favorite.id),
        productId: String(favorite.productId),
        slug: favorite.slug,
        title: favorite.title,
        image: favorite.image,
        price: (0, money_1.fromCents)(favorite.priceCents),
        createdAt: favorite.createdAt?.toISOString(),
    };
}
async function listAdminCustomers(input) {
    const where = {};
    if (input.q) {
        where.OR = [
            { name: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
            { phone: { contains: input.q, mode: "insensitive" } },
        ];
    }
    if (input.segment && input.segment !== "all")
        where.segment = input.segment;
    const [rows, total] = await Promise.all([
        prisma_1.prisma.customer.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.customer.count({ where }),
    ]);
    return {
        data: rows.map(toCustomer),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getAdminCustomerById(id) {
    const customer = await prisma_1.prisma.customer.findUnique({ where: { id } });
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    return toCustomer(customer);
}
async function updateAdminCustomer(id, input) {
    const customer = await prisma_1.prisma.customer.findUnique({ where: { id } });
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    const updated = await prisma_1.prisma.customer.update({
        where: { id },
        data: {
            ...(input.segment !== undefined ? { segment: input.segment } : {}),
            ...(input.tags !== undefined ? { tags: input.tags } : {}),
            ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        },
    });
    await (0, auth_service_1.invalidateMeCacheForUser)(updated.id);
    return toCustomer(updated);
}
async function listAdminCustomerOrders(customerId) {
    const rows = await prisma_1.prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
    });
    return rows.map(toOrder);
}
async function getMeProfile(customerId) {
    const customer = await prisma_1.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    return toCustomer(customer);
}
async function patchMeProfile(customerId, input) {
    const customer = await prisma_1.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer)
        throw new apiError_1.ApiError(404, "Cliente n�o encontrado.");
    const updated = await prisma_1.prisma.customer.update({
        where: { id: customerId },
        data: {
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        },
    });
    await (0, auth_service_1.invalidateMeCacheForUser)(updated.id);
    return toCustomer(updated);
}
async function listMeAddresses(customerId) {
    const rows = await prisma_1.prisma.customerAddress.findMany({
        where: { customerId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toAddress);
}
async function createMeAddress(customerId, input) {
    if (input.isDefault) {
        await prisma_1.prisma.customerAddress.updateMany({
            where: { customerId },
            data: { isDefault: false },
        });
    }
    const created = await prisma_1.prisma.customerAddress.create({
        data: {
            ...input,
            customerId,
        },
    });
    return toAddress(created);
}
async function updateMeAddress(customerId, addressId, input) {
    const address = await prisma_1.prisma.customerAddress.findFirst({
        where: { id: addressId, customerId },
    });
    if (!address)
        throw new apiError_1.ApiError(404, "Endere�o n�o encontrado.");
    if (input.isDefault) {
        await prisma_1.prisma.customerAddress.updateMany({
            where: { customerId },
            data: { isDefault: false },
        });
    }
    const updated = await prisma_1.prisma.customerAddress.update({
        where: { id: address.id },
        data: input,
    });
    return toAddress(updated);
}
async function deleteMeAddress(customerId, addressId) {
    await prisma_1.prisma.customerAddress.deleteMany({
        where: { id: addressId, customerId },
    });
}
async function listMeFavorites(customerId) {
    const rows = await prisma_1.prisma.favorite.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
    });
    return rows.map(toFavorite);
}
async function addMeFavorite(customerId, productId) {
    const product = await prisma_1.prisma.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new apiError_1.ApiError(404, "Produto n�o encontrado.");
    const row = await prisma_1.prisma.favorite.upsert({
        where: {
            customerId_productId: {
                customerId,
                productId,
            },
        },
        update: {
            slug: product.slug,
            title: product.name,
            image: Array.isArray(product.images) && product.images.length ? String(product.images[0]) : "",
            priceCents: product.priceCents,
        },
        create: {
            customerId,
            productId,
            slug: product.slug,
            title: product.name,
            image: Array.isArray(product.images) && product.images.length ? String(product.images[0]) : "",
            priceCents: product.priceCents,
        },
    });
    return toFavorite(row);
}
async function removeMeFavorite(customerId, productId) {
    await prisma_1.prisma.favorite.deleteMany({
        where: { customerId, productId },
    });
}
async function refreshCustomerMetrics(customerId) {
    const [ordersCount, totals] = await Promise.all([
        prisma_1.prisma.order.count({ where: { customerId } }),
        prisma_1.prisma.order.aggregate({
            where: {
                customerId,
                status: { in: ["pago", "separacao", "enviado", "entregue"] },
            },
            _sum: { totalCents: true },
            _max: { createdAt: true },
        }),
    ]);
    await prisma_1.prisma.customer.update({
        where: { id: customerId },
        data: {
            ordersCount,
            totalSpentCents: totals._sum.totalCents || 0,
            lastOrderAt: totals._max.createdAt || null,
            segment: ordersCount >= 6 ? "vip" : ordersCount >= 2 ? "recorrente" : "novo",
        },
    });
}
async function getMeCashbackBalance(customerId) {
    const row = await prisma_1.prisma.cashbackLedger.findFirst({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        select: { balanceAfterCents: true },
    });
    const balance = row?.balanceAfterCents || 0;
    return {
        balance: (0, money_1.fromCents)(balance),
        balanceCents: balance,
    };
}
async function createCustomerFromGuest(input) {
    const created = await prisma_1.prisma.customer.create({
        data: {
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone,
            passwordHash: input.passwordHash,
            segment: "novo",
            ordersCount: 0,
            totalSpentCents: (0, money_1.toCents)(0),
        },
    });
    return created;
}
