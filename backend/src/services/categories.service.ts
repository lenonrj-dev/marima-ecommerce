import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { slugify } from "../utils/slug";
import { buildMeta } from "../utils/pagination";

function canonicalCategorySlug(value: string) {
  const key = String(value || "").trim().toLocaleLowerCase("pt-BR");
  if (key === "acessorios" || key === "acessórios") return "casual";
  return key;
}

function toOutput(category: any) {
  return {
    id: String(category.id),
    name: category.name,
    slug: category.slug,
    active: category.active,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt?.toISOString(),
    updatedAt: category.updatedAt?.toISOString(),
  };
}

export async function listCategories(input: {
  page: number;
  limit: number;
  q?: string;
  active?: boolean;
}) {
  const where: any = {};

  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { slug: { contains: input.q, mode: "insensitive" } },
    ];
  }

  if (typeof input.active === "boolean") where.active = input.active;

  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.category.count({ where }),
  ]);

  return {
    data: rows.map(toOutput),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function createCategory(input: { name: string; slug?: string; active?: boolean; sortOrder?: number }) {
  const slug = slugify(input.slug || input.name);

  const exists = await prisma.category.findFirst({
    where: {
      OR: [{ name: input.name.trim() }, { slug }],
    },
  });
  if (exists) throw new ApiError(409, "Categoria já cadastrada.");

  const created = await prisma.category.create({
    data: {
      name: input.name.trim(),
      slug,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  return toOutput(created);
}

export async function updateCategory(id: string, input: { name?: string; slug?: string; active?: boolean; sortOrder?: number }) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "Categoria não encontrada.");

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: slugify(input.slug) } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  return toOutput(updated);
}

export async function listStoreCategories() {
  const rows = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const counts = await prisma.product.groupBy({
    by: ["category"],
    where: {
      active: true,
      stock: { gt: 0 },
    },
    _count: { _all: true },
  });

  const countMap = new Map<string, number>();
  for (const row of counts) {
    const key = canonicalCategorySlug(row.category);
    countMap.set(key, (countMap.get(key) ?? 0) + row._count._all);
  }

  const seen = new Set<string>();
  const output: Array<ReturnType<typeof toOutput> & { productCount: number }> = [];

  for (const row of rows) {
    const slug = canonicalCategorySlug(row.slug);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const base = toOutput(row);
    output.push({
      ...base,
      slug,
      name: slug === "casual" ? "Casual" : base.name,
      productCount: countMap.get(slug) ?? 0,
    });
  }

  return output;
}
