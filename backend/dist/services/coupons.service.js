"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCoupons = listCoupons;
exports.createCoupon = createCoupon;
exports.updateCoupon = updateCoupon;
exports.toggleCoupon = toggleCoupon;
exports.validateCoupon = validateCoupon;
exports.registerCouponRedemption = registerCouponRedemption;
exports.toCoupon = toCoupon;
const Coupon_1 = require("../models/Coupon");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
const money_1 = require("../utils/money");
function toCoupon(coupon) {
    return {
        id: String(coupon._id),
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
    const query = {};
    if (input.q) {
        query.$or = [
            { code: { $regex: input.q, $options: "i" } },
            { description: { $regex: input.q, $options: "i" } },
        ];
    }
    const [rows, total] = await Promise.all([
        Coupon_1.CouponModel.find(query)
            .sort({ createdAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Coupon_1.CouponModel.countDocuments(query),
    ]);
    return { data: rows.map(toCoupon), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function createCoupon(input) {
    const code = input.code.trim().toUpperCase();
    const exists = await Coupon_1.CouponModel.findOne({ code });
    if (exists)
        throw new apiError_1.ApiError(409, "Cupom já existe.");
    const created = await Coupon_1.CouponModel.create({
        code,
        description: input.description.trim(),
        type: input.type,
        amount: input.type === "fixed" ? (0, money_1.toCents)(input.amount) : input.amount,
        minSubtotalCents: input.minSubtotal ? (0, money_1.toCents)(input.minSubtotal) : undefined,
        maxUses: input.maxUses,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        active: input.active ?? true,
    });
    return toCoupon(created);
}
async function updateCoupon(id, input) {
    const coupon = await Coupon_1.CouponModel.findById(id);
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom não encontrado.");
    if (input.description !== undefined)
        coupon.description = input.description.trim();
    if (input.type !== undefined)
        coupon.type = input.type;
    if (input.amount !== undefined)
        coupon.amount = coupon.type === "fixed" ? (0, money_1.toCents)(input.amount) : input.amount;
    if (input.minSubtotal !== undefined)
        coupon.minSubtotalCents = input.minSubtotal ? (0, money_1.toCents)(input.minSubtotal) : undefined;
    if (input.maxUses !== undefined)
        coupon.maxUses = input.maxUses;
    if (input.startsAt !== undefined)
        coupon.startsAt = new Date(input.startsAt);
    if (input.endsAt !== undefined)
        coupon.endsAt = new Date(input.endsAt);
    if (input.active !== undefined)
        coupon.active = input.active;
    await coupon.save();
    return toCoupon(coupon);
}
async function toggleCoupon(id) {
    const coupon = await Coupon_1.CouponModel.findById(id);
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom não encontrado.");
    coupon.active = !coupon.active;
    await coupon.save();
    return toCoupon(coupon);
}
async function validateCoupon(code, subtotalCents) {
    const normalized = code.trim().toUpperCase();
    const coupon = await Coupon_1.CouponModel.findOne({ code: normalized, active: true });
    if (!coupon)
        throw new apiError_1.ApiError(404, "Cupom não encontrado.");
    const now = new Date();
    if (coupon.startsAt > now || coupon.endsAt < now)
        throw new apiError_1.ApiError(400, "Cupom inválido para o período atual.");
    if (coupon.maxUses && coupon.uses >= coupon.maxUses)
        throw new apiError_1.ApiError(400, "Cupom sem saldo de usos.");
    if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents)
        throw new apiError_1.ApiError(400, "Subtotal mínimo não atingido.");
    let discountCents = 0;
    if (coupon.type === "percent")
        discountCents = Math.round(subtotalCents * (coupon.amount / 100));
    if (coupon.type === "fixed")
        discountCents = Math.min(subtotalCents, coupon.amount);
    return {
        couponId: String(coupon._id),
        code: coupon.code,
        type: coupon.type,
        discountCents,
    };
}
async function registerCouponRedemption(input) {
    const coupon = await Coupon_1.CouponModel.findOne({ code: input.couponCode.toUpperCase() });
    if (!coupon)
        return;
    coupon.uses += 1;
    coupon.redemptions.push({
        orderId: input.orderId,
        customerId: input.customerId,
        discountCents: input.discountCents,
    });
    await coupon.save();
}
