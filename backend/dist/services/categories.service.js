"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.listStoreCategories = listStoreCategories;
const Category_1 = require("../models/Category");
const Product_1 = require("../models/Product");
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
        id: String(category._id),
        name: category.name,
        slug: category.slug,
        active: category.active,
        sortOrder: category.sortOrder,
        createdAt: category.createdAt?.toISOString(),
        updatedAt: category.updatedAt?.toISOString(),
    };
}
async function listCategories(input) {
    const query = {};
    if (input.q) {
        query.$or = [
            { name: { $regex: input.q, $options: "i" } },
            { slug: { $regex: input.q, $options: "i" } },
        ];
    }
    if (typeof input.active === "boolean")
        query.active = input.active;
    const [rows, total] = await Promise.all([
        Category_1.CategoryModel.find(query)
            .sort({ sortOrder: 1, name: 1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        Category_1.CategoryModel.countDocuments(query),
    ]);
    return {
        data: rows.map(toOutput),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function createCategory(input) {
    const slug = (0, slug_1.slugify)(input.slug || input.name);
    const exists = await Category_1.CategoryModel.findOne({ $or: [{ name: input.name.trim() }, { slug }] });
    if (exists)
        throw new apiError_1.ApiError(409, "Categoria j� cadastrada.");
    const created = await Category_1.CategoryModel.create({
        name: input.name.trim(),
        slug,
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? 0,
    });
    return toOutput(created);
}
async function updateCategory(id, input) {
    const category = await Category_1.CategoryModel.findById(id);
    if (!category)
        throw new apiError_1.ApiError(404, "Categoria n�o encontrada.");
    if (input.name !== undefined)
        category.name = input.name.trim();
    if (input.slug !== undefined)
        category.slug = (0, slug_1.slugify)(input.slug);
    if (input.active !== undefined)
        category.active = input.active;
    if (input.sortOrder !== undefined)
        category.sortOrder = input.sortOrder;
    await category.save();
    return toOutput(category);
}
async function listStoreCategories() {
    const rows = await Category_1.CategoryModel.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    const counts = await Product_1.ProductModel.aggregate([
        // Store catalog only shows active products with stock available.
        { $match: { active: true, stock: { $gt: 0 } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = new Map();
    for (const row of counts) {
        const key = canonicalCategorySlug(row._id);
        countMap.set(key, (countMap.get(key) ?? 0) + row.count);
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
