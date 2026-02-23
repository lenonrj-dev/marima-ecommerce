import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";
import { fromCents, toCents } from "../utils/money";

function toCoupon(coupon: any) {
  return {
    id: String(coupon.id),
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
  const where: any = {};
  if (input.q) {
    where.OR = [
      { code: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.coupon.count({ where }),
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

  try {
    const created = await prisma.coupon.create({
      data: {
        code,
        description: input.description.trim(),
        type: input.type,
        amount: input.type === "fixed" ? toCents(input.amount) : input.amount,
        minSubtotalCents: input.minSubtotal ? toCents(input.minSubtotal) : undefined,
        maxUses: input.maxUses,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        active: input.active ?? true,
      },
    });

    return toCoupon(created);
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(409, "Cupom já existe.");
    }
    throw error;
  }
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
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "Cupom não encontrado.");

  const nextType = input.type ?? coupon.type;

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.amount !== undefined
        ? {
            amount: nextType === "fixed" ? toCents(input.amount) : input.amount,
          }
        : {}),
      ...(input.minSubtotal !== undefined
        ? { minSubtotalCents: input.minSubtotal ? toCents(input.minSubtotal) : null }
        : {}),
      ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
      ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
      ...(input.endsAt !== undefined ? { endsAt: new Date(input.endsAt) } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });

  return toCoupon(updated);
}

export async function toggleCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new ApiError(404, "Cupom não encontrado.");

  const updated = await prisma.coupon.update({
    where: { id },
    data: { active: !coupon.active },
  });

  return toCoupon(updated);
}

export async function validateCoupon(code: string, subtotalCents: number) {
  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findFirst({ where: { code: normalized, active: true } });
  if (!coupon) throw new ApiError(404, "Cupom não encontrado.");

  const now = new Date();
  if (coupon.startsAt > now || coupon.endsAt < now) throw new ApiError(400, "Cupom inválido para o período atual.");
  if (coupon.maxUses && coupon.uses >= coupon.maxUses) throw new ApiError(400, "Cupom sem saldo de usos.");
  if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents) throw new ApiError(400, "Subtotal mínimo não atingido.");

  let discountCents = 0;
  if (coupon.type === "percent") discountCents = Math.round(subtotalCents * (coupon.amount / 100));
  if (coupon.type === "fixed") discountCents = Math.min(subtotalCents, Math.floor(coupon.amount));

  return {
    couponId: String(coupon.id),
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
  const coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
  if (!coupon) return;

  const redemptions = Array.isArray(coupon.redemptions) ? coupon.redemptions : [];

  await prisma.$transaction(async (tx) => {
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

export { toCoupon };
