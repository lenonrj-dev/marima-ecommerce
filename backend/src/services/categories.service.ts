import { FilterQuery } from "../lib/dbCompat";
import { CategoryModel } from "../models/Category";
import { ProductModel } from "../models/Product";
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
    id: String(category._id),
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
  const query: FilterQuery<any> = {};

  if (input.q) {
    query.$or = [
      { name: { $regex: input.q, $options: "i" } },
      { slug: { $regex: input.q, $options: "i" } },
    ];
  }

  if (typeof input.active === "boolean") query.active = input.active;

  const [rows, total] = await Promise.all([
    CategoryModel.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    CategoryModel.countDocuments(query),
  ]);

  return {
    data: rows.map(toOutput),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function createCategory(input: { name: string; slug?: string; active?: boolean; sortOrder?: number }) {
  const slug = slugify(input.slug || input.name);

  const exists = await CategoryModel.findOne({ $or: [{ name: input.name.trim() }, { slug }] });
  if (exists) throw new ApiError(409, "Categoria já cadastrada.");

  const created = await CategoryModel.create({
    name: input.name.trim(),
    slug,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  });

  return toOutput(created);
}

export async function updateCategory(id: string, input: { name?: string; slug?: string; active?: boolean; sortOrder?: number }) {
  const category = await CategoryModel.findById(id);
  if (!category) throw new ApiError(404, "Categoria não encontrada.");

  if (input.name !== undefined) category.name = input.name.trim();
  if (input.slug !== undefined) category.slug = slugify(input.slug);
  if (input.active !== undefined) category.active = input.active;
  if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;

  await category.save();
  return toOutput(category);
}

export async function listStoreCategories() {
  const rows = await CategoryModel.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  const counts = await ProductModel.aggregate([
    // Store catalog only shows active products with stock available.
    { $match: { active: true, stock: { $gt: 0 } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map<string, number>();
  for (const row of counts) {
    const key = canonicalCategorySlug(row._id);
    countMap.set(key, (countMap.get(key) ?? 0) + row.count);
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


