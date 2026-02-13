import { connectDb, disconnectDb } from "./config/db";
import { ProductModel } from "./models/Product";
import { normalizeColorVariantInput } from "./utils/colorVariants";

async function migrateColors() {
  await connectDb();

  let scanned = 0;
  let updated = 0;
  let unchanged = 0;
  let withoutColor = 0;

  const cursor = ProductModel.find({}, { name: 1, category: 1, groupKey: 1, colorName: 1, colorHex: 1 }).cursor();

  for await (const product of cursor) {
    scanned += 1;

    const hasGroupKey = typeof product.groupKey === "string" && product.groupKey.trim().length > 0;
    const hasColorName = typeof product.colorName === "string" && product.colorName.trim().length > 0;
    const hasColorHex = typeof product.colorHex === "string" && product.colorHex.trim().length > 0;

    if (hasGroupKey && hasColorName) {
      unchanged += 1;
      continue;
    }

    const normalized = normalizeColorVariantInput({
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

    let changed = false;

    if (!hasGroupKey) {
      product.groupKey = normalized.inferred.groupKey;
      changed = true;
    }
    if (!hasColorName) {
      product.colorName = normalized.inferred.colorName;
      changed = true;
    }
    if (!hasColorHex && normalized.inferred.colorHex) {
      product.colorHex = normalized.inferred.colorHex;
      changed = true;
    }

    if (!changed) {
      unchanged += 1;
      continue;
    }

    await product.save();
    updated += 1;
  }

  // Relatório objetivo para conferência
  console.log(
    JSON.stringify(
      { scanned, updated, unchanged, withoutColor },
      null,
      2,
    ),
  );

  await disconnectDb();
}

migrateColors().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
