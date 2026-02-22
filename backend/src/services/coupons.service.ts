import { FilterQuery } from "../lib/dbCompat";
import { CouponModel } from "../models/Coupon";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents, toCents } from "../utils/money";

function toCoupon(coupon: any) {
  return {
    id: String(coupon._id),
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    amount: coupon.type === "fixed" ? fromCents(coupon.amount) : coupon.amount,
    amountCents: coupon.type === "fixed" ? coupon.amount : undefined,
    minSubtotal: coupon.minSubtotalCents ? fromCents(coupon.minSubtotalCents) : undefined,
    minSubtotalCents: coupon.minSubtotalCents,
    uses: coupon.uses,
    maxUses: coupon.maxUses,
    startsAt: coupon.startsAt?.toISOString(),
    endsAt: coupon.endsAt?.toISOString(),
    active: coupon.active,
    createdAt: coupon.createdAt?.toISOString(),
  };
}

export async function listCoupons(input: { page: number; limit: number; q?: string }) {
  const query: FilterQuery<any> = {};
  if (input.q) {
    query.$or = [
      { code: { $regex: input.q, $options: "i" } },
      { description: { $regex: input.q, $options: "i" } },
    ];
  }

  const [rows, total] = await Promise.all([
    CouponModel.find(query)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    CouponModel.countDocuments(query),
  ]);

  return { data: rows.map(toCoupon), meta: buildMeta(total, input.page, input.limit) };
}

export async function createCoupon(input: {
  code: string;
  description: string;
  type: "percent" | "fixed" | "shipping";
  amount: number;
  minSubtotal?: number;
  maxUses?: number;
  startsAt: string;
  endsAt: string;
  active?: boolean;
}) {
  const code = input.code.trim().toUpperCase();
  const exists = await CouponModel.findOne({ code });
  if (exists) throw new ApiError(409, "Cupom já existe.");

  const created = await CouponModel.create({
    code,
    description: input.description.trim(),
    type: input.type,
    amount: input.type === "fixed" ? toCents(input.amount) : input.amount,
    minSubtotalCents: input.minSubtotal ? toCents(input.minSubtotal) : undefined,
    maxUses: input.maxUses,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    active: input.active ?? true,
  });

  return toCoupon(created);
}

export async function updateCoupon(
  id: string,
  input: Partial<{
    description: string;
    type: "percent" | "fixed" | "shipping";
    amount: number;
    minSubtotal?: number;
    maxUses?: number;
    startsAt: string;
    endsAt: string;
    active: boolean;
  }>,
) {
  const coupon = await CouponModel.findById(id);
  if (!coupon) throw new ApiError(404, "Cupom não encontrado.");

  if (input.description !== undefined) coupon.description = input.description.trim();
  if (input.type !== undefined) coupon.type = input.type;
  if (input.amount !== undefined) coupon.amount = coupon.type === "fixed" ? toCents(input.amount) : input.amount;
  if (input.minSubtotal !== undefined) coupon.minSubtotalCents = input.minSubtotal ? toCents(input.minSubtotal) : undefined;
  if (input.maxUses !== undefined) coupon.maxUses = input.maxUses;
  if (input.startsAt !== undefined) coupon.startsAt = new Date(input.startsAt);
  if (input.endsAt !== undefined) coupon.endsAt = new Date(input.endsAt);
  if (input.active !== undefined) coupon.active = input.active;

  await coupon.save();
  return toCoupon(coupon);
}

export async function toggleCoupon(id: string) {
  const coupon = await CouponModel.findById(id);
  if (!coupon) throw new ApiError(404, "Cupom não encontrado.");

  coupon.active = !coupon.active;
  await coupon.save();

  return toCoupon(coupon);
}

export async function validateCoupon(code: string, subtotalCents: number) {
  const normalized = code.trim().toUpperCase();
  const coupon = await CouponModel.findOne({ code: normalized, active: true });
  if (!coupon) throw new ApiError(404, "Cupom não encontrado.");

  const now = new Date();
  if (coupon.startsAt > now || coupon.endsAt < now) throw new ApiError(400, "Cupom inválido para o período atual.");
  if (coupon.maxUses && coupon.uses >= coupon.maxUses) throw new ApiError(400, "Cupom sem saldo de usos.");
  if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents) throw new ApiError(400, "Subtotal mínimo não atingido.");

  let discountCents = 0;
  if (coupon.type === "percent") discountCents = Math.round(subtotalCents * (coupon.amount / 100));
  if (coupon.type === "fixed") discountCents = Math.min(subtotalCents, coupon.amount);

  return {
    couponId: String(coupon._id),
    code: coupon.code,
    type: coupon.type,
    discountCents,
  };
}

export async function registerCouponRedemption(input: {
  couponCode: string;
  orderId: string;
  customerId?: string;
  discountCents: number;
}) {
  const coupon = await CouponModel.findOne({ code: input.couponCode.toUpperCase() });
  if (!coupon) return;

  coupon.uses += 1;
  coupon.redemptions.push({
    orderId: input.orderId as any,
    customerId: input.customerId as any,
    discountCents: input.discountCents,
  });

  await coupon.save();
}

export { toCoupon };

