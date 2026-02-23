"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.listStoreCategories = listStoreCategories;
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const slug_1 = require("../utils/slug");
const pagination_1 = require("../utils/pagination");
function canonicalCategorySlug(value) {
    const key = String(value || "").trim().toLocaleLowerCase("pt-BR");
    if (key === "acessorios" || key === "acess�rios")
        return "casual";
    return key;
}
function toOutput(category) {
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
async function listCategories(input) {
    const where = {};
    if (input.q) {
        where.OR = [
            { name: { contains: input.q, mode: "insensitive" } },
            { slug: { contains: input.q, mode: "insensitive" } },
        ];
    }
    if (typeof input.active === "boolean")
        where.active = input.active;
    const [rows, total] = await Promise.all([
        prisma_1.prisma.category.findMany({
            where,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.category.count({ where }),
    ]);
    return {
        data: rows.map(toOutput),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function createCategory(input) {
    const slug = (0, slug_1.slugify)(input.slug || input.name);
    const exists = await prisma_1.prisma.category.findFirst({
        where: {
            OR: [{ name: input.name.trim() }, { slug }],
        },
    });
    if (exists)
        throw new apiError_1.ApiError(409, "Categoria j� cadastrada.");
    const created = await prisma_1.prisma.category.create({
        data: {
            name: input.name.trim(),
            slug,
            active: input.active ?? true,
            sortOrder: input.sortOrder ?? 0,
        },
    });
    return toOutput(created);
}
async function updateCategory(id, input) {
    const category = await prisma_1.prisma.category.findUnique({ where: { id } });
    if (!category)
        throw new apiError_1.ApiError(404, "Categoria n�o encontrada.");
    const updated = await prisma_1.prisma.category.update({
        where: { id },
        data: {
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.slug !== undefined ? { slug: (0, slug_1.slugify)(input.slug) } : {}),
            ...(input.active !== undefined ? { active: input.active } : {}),
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        },
    });
    return toOutput(updated);
}
async function listStoreCategories() {
    const rows = await prisma_1.prisma.category.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    const counts = await prisma_1.prisma.product.groupBy({
        by: ["category"],
        where: {
            active: true,
            stock: { gt: 0 },
        },
        _count: { _all: true },
    });
    const countMap = new Map();
    for (const row of counts) {
        const key = canonicalCategorySlug(row.category);
        countMap.set(key, (countMap.get(key) ?? 0) + row._count._all);
    }
    const seen = new Set();
    const output = [];
    for (const row of rows) {
        const slug = canonicalCategorySlug(row.slug);
        if (seen.has(slug))
            continue;
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
