import { slugify } from "./slug";

type ColorPreset = {
  name: string;
  hex: string;
  aliases: string[];
};

const COLOR_PRESETS: ColorPreset[] = [
  { name: "Preto", hex: "#111111", aliases: ["preto", "preta"] },
  { name: "Branco", hex: "#ffffff", aliases: ["branco", "branca"] },
  { name: "Off White", hex: "#f5f2ea", aliases: ["off white", "off-white", "offwhite"] },
  { name: "Cinza", hex: "#a1a1aa", aliases: ["cinza", "prata"] },
  { name: "Grafite", hex: "#3f3f46", aliases: ["grafite"] },
  { name: "Marrom", hex: "#6b4f3a", aliases: ["marrom", "chocolate"] },
  { name: "Bege", hex: "#d8c7a3", aliases: ["bege", "areia"] },
  { name: "Nude", hex: "#e8c8b6", aliases: ["nude"] },
  { name: "Caramelo", hex: "#b77742", aliases: ["caramelo"] },
  { name: "Vermelho", hex: "#dc2626", aliases: ["vermelho", "vermelha"] },
  { name: "Vinho", hex: "#5a1026", aliases: ["vinho", "bordô", "bordo"] },
  { name: "Rosa", hex: "#ec4899", aliases: ["rosa", "pink"] },
  { name: "Roxo", hex: "#7c3aed", aliases: ["roxo", "roxa"] },
  { name: "Lilás", hex: "#a78bfa", aliases: ["lilás", "lilas"] },
  { name: "Azul", hex: "#2563eb", aliases: ["azul"] },
  { name: "Azul Marinho", hex: "#0b1f3b", aliases: ["azul marinho", "marinho"] },
  { name: "Azul petróleo", hex: "#164e63", aliases: ["azul petróleo", "azul petroleo", "petróleo", "petroleo"] },
  { name: "Verde", hex: "#16a34a", aliases: ["verde"] },
  { name: "Verde Oliva", hex: "#4d5d3b", aliases: ["verde oliva", "oliva"] },
];

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeForMatch(value: string) {
  return stripDiacritics(String(value || ""))
    .toLocaleLowerCase("pt-BR")
    .replace(/[_/]+/g, " ")
    .replace(/[-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?\u00b7]+$/g, "")
    .trim();
}

function normalizeName(value: string) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?\u00b7]+$/g, "")
    .replace(/\s*[-–—]+\s*$/g, "")
    .trim();
}

function normalizeHex(value: unknown) {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex)) return undefined;
  return hex.toLocaleLowerCase("pt-BR");
}

export function getDefaultColorHex(colorName: string) {
  const key = normalizeForMatch(colorName);
  for (const preset of COLOR_PRESETS) {
    const names = [preset.name, ...preset.aliases];
    if (names.some((alias) => normalizeForMatch(alias) === key)) return preset.hex;
  }
  return undefined;
}

function detectColorFromName(inputName: string) {
  const name = normalizeName(inputName);
  if (!name) return null;

  const normalized = normalizeForMatch(name);

  // Pattern: "Produto (Preto)"
  const parenMatch = /\(([^)]+)\)\s*$/.exec(name);
  if (parenMatch) {
    const inside = normalizeForMatch(parenMatch[1] || "");
    for (const preset of COLOR_PRESETS) {
      if (preset.aliases.some((alias) => normalizeForMatch(alias) === inside) || normalizeForMatch(preset.name) === inside) {
        const baseName = normalizeName(name.replace(/\s*\([^)]+\)\s*$/, ""));
        return { baseName, preset };
      }
    }
  }

  // Pattern: "Produto Preto"
  const presetsByLongestAlias = [...COLOR_PRESETS].sort((a, b) => {
    const aLen = Math.max(a.name.length, ...a.aliases.map((alias) => alias.length));
    const bLen = Math.max(b.name.length, ...b.aliases.map((alias) => alias.length));
    return bLen - aLen;
  });

  for (const preset of presetsByLongestAlias) {
    const candidates = [preset.name, ...preset.aliases];
    for (const alias of candidates) {
      const aliasNormalized = normalizeForMatch(alias);
      if (!aliasNormalized) continue;

      if (normalized === aliasNormalized) {
        return { baseName: "", preset };
      }

      if (normalized.endsWith(` ${aliasNormalized}`)) {
        const baseName = normalizeName(name.slice(0, Math.max(0, name.length - alias.length)));
        return { baseName, preset };
      }
    }
  }

  return null;
}

export function inferColorGroupingFields(input: { name: string; category?: string }) {
  const detected = detectColorFromName(input.name);
  if (!detected) return null;

  const baseName = detected.baseName;
  if (!baseName) return null;

  const category = String(input.category || "").trim();
  const categoryKey = category ? slugify(category) : "";
  const groupKey = categoryKey ? `${slugify(baseName)}-${categoryKey}` : slugify(baseName);
  if (!groupKey) return null;

  return {
    groupKey,
    colorName: detected.preset.name,
    colorHex: detected.preset.hex,
    baseName,
  };
}

export function normalizeColorVariantInput(input: {
  groupKey?: unknown;
  colorName?: unknown;
  colorHex?: unknown;
  productName: string;
  category?: string;
}) {
  const explicitGroupKeyRaw =
    input.groupKey === undefined
      ? undefined
      : typeof input.groupKey === "string"
        ? input.groupKey.trim()
          ? slugify(input.groupKey)
          : ""
        : "";

  const explicitColorNameRaw =
    input.colorName === undefined
      ? undefined
      : typeof input.colorName === "string"
        ? input.colorName.trim()
        : "";

  const explicitColorHex = input.colorHex === undefined ? undefined : normalizeHex(input.colorHex);

  const inferred = inferColorGroupingFields({ name: input.productName, category: input.category });

  const explicitGroupKey = explicitGroupKeyRaw === "" ? null : explicitGroupKeyRaw;
  const explicitColorName = explicitColorNameRaw === "" ? null : explicitColorNameRaw;

  const groupKey = explicitGroupKey === undefined ? inferred?.groupKey : explicitGroupKey ?? undefined;
  const colorName = explicitColorName === undefined ? inferred?.colorName : explicitColorName ?? undefined;

  const colorHex =
    explicitColorHex !== undefined
      ? explicitColorHex
      : colorName
        ? getDefaultColorHex(colorName) ?? inferred?.colorHex
        : inferred?.colorHex;

  return {
    groupKey,
    colorName,
    colorHex,
    inferred,
  };
}
