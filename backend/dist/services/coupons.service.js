"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCoupons = listCoupons;
exports.createCoupon = createCoupon;
exports.updateCoupon = updateCoupon;
exports.toggleCoupon = toggleCoupon;
exports.validateCoupon = validateCoupon;
exports.registerCouponRedemption = registerCouponRedemption;
exports.toCoupon = toCoupon;
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
function toCoupon(coupon) {
    return {
        id: String(coupon.id),
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        amount: coupon.type === "fixed" ? (0, money_1.fromCents)(coupon.amount) : coupon.amount,
        amountCents: coupon.type === "fixed" ? coupon.amount : undefined,
        minSubtotal: coupon.minSubtotalCents ? (0, money_1.fromCents)(coupon.minSubtotalCents) : undefined,
        minSubtotalCents: coupon.minSubtotalCents,
        uses: coupon.uses,
        maxUses: coupon.maxUses,
        startsAt: coupon.startsAt?.toISOString(),
        endsAt: coupon.endsAt?.toISOString(),
        active: coupon.active,
        createdAt: coupon.createdAt?.toISOString(),
    };
}
async function listCoupons(input) {
    const where = {};
    if (input.q) {
        where.OR = [
            { code: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
        ];
    }
    const [rows, total] = await Promise.all([
        prisma_1.prisma.coupon.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.coupon.count({ where }),
    ]);
    return { data: rows.map(toCoupon), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function createCoupon(input) {
    const code = input.code.trim().toUpperCase();
    try {
        const created = await prisma_1.prisma.coupon.create({
            data: {
                code,
                description: input.description.trim(),
                type: input.type,
                amount: input.type === "fixed" ? (0, money_1.toCents)(input.amount) : input.amount,
                minSubtotalCents: input.minSubtotal ? (0, money_1.toCents)(input.minSubtotal) : undefined,
                maxUses: input.maxUses,
                startsAt: new Date(input.startsAt),
                endsAt: new Date(input.endsAt),
                active: input.active ?? true,
            },
        });
        return toCoupon(created);
    }
    catch (error) {
        if (error?.code === "P2002") {
            throw new apiError_1.ApiError(409, "Cupom j� existe.");
        }
        throw error;
    }
}
async function updateCoupon(id, input) {
    const coupon = await prisma_1.prisma.coupon.findUnique({ where: { id } });
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom n�o encontrado.");
    const nextType = input.type ?? coupon.type;
    const updated = await prisma_1.prisma.coupon.update({
        where: { id },
        data: {
            ...(input.description !== undefined ? { description: input.description.trim() } : {}),
            ...(input.type !== undefined ? { type: input.type } : {}),
            ...(input.amount !== undefined
                ? {
                    amount: nextType === "fixed" ? (0, money_1.toCents)(input.amount) : input.amount,
                }
                : {}),
            ...(input.minSubtotal !== undefined
                ? { minSubtotalCents: input.minSubtotal ? (0, money_1.toCents)(input.minSubtotal) : null }
                : {}),
            ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
            ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
            ...(input.endsAt !== undefined ? { endsAt: new Date(input.endsAt) } : {}),
            ...(input.active !== undefined ? { active: input.active } : {}),
        },
    });
    return toCoupon(updated);
}
async function toggleCoupon(id) {
    const coupon = await prisma_1.prisma.coupon.findUnique({ where: { id } });
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom n�o encontrado.");
    const updated = await prisma_1.prisma.coupon.update({
        where: { id },
        data: { active: !coupon.active },
    });
    return toCoupon(updated);
}
async function validateCoupon(code, subtotalCents) {
    const normalized = code.trim().toUpperCase();
    const coupon = await prisma_1.prisma.coupon.findFirst({ where: { code: normalized, active: true } });
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom n�o encontrado.");
    const now = new Date();
    if (coupon.startsAt > now || coupon.endsAt < now)
        throw new apiError_1.ApiError(400, "Cupom inv�lido para o per�odo atual.");
    if (coupon.maxUses && coupon.uses >= coupon.maxUses)
        throw new apiError_1.ApiError(400, "Cupom sem saldo de usos.");
    if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents)
        throw new apiError_1.ApiError(400, "Subtotal m�nimo n�o atingido.");
    let discountCents = 0;
    if (coupon.type === "percent")
        discountCents = Math.round(subtotalCents * (coupon.amount / 100));
    if (coupon.type === "fixed")
        discountCents = Math.min(subtotalCents, Math.floor(coupon.amount));
    return {
        couponId: String(coupon.id),
        code: coupon.code,
        type: coupon.type,
        discountCents,
    };
}
async function registerCouponRedemption(input) {
    const coupon = await prisma_1.prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
    if (!coupon)
        return;
    const redemptions = Array.isArray(coupon.redemptions) ? coupon.redemptions : [];
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.coupon.update({
            where: { id: coupon.id },
            data: {
                uses: { increment: 1 },
                redemptions: [
                    ...redemptions,
                    {
                        orderId: input.orderId,
                        customerId: input.customerId,
                        discountCents: input.discountCents,
                    },
                ],
            },
        });
        await tx.couponRedemption.create({
            data: {
                couponId: coupon.id,
                orderId: input.orderId,
                customerId: input.customerId,
                discountCents: input.discountCents,
            },
        });
    });
}
