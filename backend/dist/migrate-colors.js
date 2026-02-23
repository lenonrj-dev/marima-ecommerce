"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./lib/prisma");
const colorVariants_1 = require("./utils/colorVariants");
async function migrateColors() {
    let scanned = 0;
    let updated = 0;
    let unchanged = 0;
    let withoutColor = 0;
    const products = await prisma_1.prisma.product.findMany({
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            groupKey: true,
            colorName: true,
            colorHex: true,
            name: true,
            category: true,
        },
    });
    for (const product of products) {
        scanned += 1;
        const hasGroupKey = typeof product.groupKey === "string" && product.groupKey.trim().length > 0;
        const hasColorName = typeof product.colorName === "string" && product.colorName.trim().length > 0;
        const hasColorHex = typeof product.colorHex === "string" && product.colorHex.trim().length > 0;
        if (hasGroupKey && hasColorName) {
            unchanged += 1;
            continue;
        }
        const normalized = (0, colorVariants_1.normalizeColorVariantInput)({
            groupKey: product.groupKey,
            colorName: product.colorName,
            colorHex: product.colorHex,
            productName: product.name,
            category: product.category,
        });
        if (!normalized.inferred?.groupKey || !normalized.inferred?.colorName) {
            withoutColor += 1;
            continue;
        }
        const data = {};
        if (!hasGroupKey) {
            data.groupKey = normalized.inferred.groupKey;
        }
        if (!hasColorName) {
            data.colorName = normalized.inferred.colorName;
        }
        if (!hasColorHex && normalized.inferred.colorHex) {
            data.colorHex = normalized.inferred.colorHex;
        }
        if (!Object.keys(data).length) {
            unchanged += 1;
            continue;
        }
        await prisma_1.prisma.product.update({
            where: { id: product.id },
            data,
        });
        updated += 1;
    }
    console.log(JSON.stringify({ scanned, updated, unchanged, withoutColor }, null, 2));
}
migrateColors()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
