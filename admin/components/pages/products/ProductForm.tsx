"use client";

import { useMemo } from "react";
import { Badge, Button, Input, Select, Textarea, Toggle, cn } from "../../dashboard/ui";

export type DraftProduct = {
  name: string;
  sku: string;
  category: string;
  groupKey: string;
  colorName: string;
  colorHex: string;
  size: string;
  sizeType: "roupas" | "numerico" | "unico" | "custom";
  sizes: Array<{ label: string; stock: number; sku?: string; active?: boolean }>;
  stock: number;
  price: number;
  compareAtPrice: number;
  shortDescription: string;
  description: string;
  additionalInfo: Array<{ label: string; value: string }>;
  tags: string;
  status: "padrao" | "novo" | "destaque" | "oferta";
  active: boolean;
  images: string[];
};

const CATEGORIES = [
  { value: "fitness", label: "Fitness" },
  { value: "moda", label: "Moda" },
  { value: "casual", label: "Casual" },
  { value: "suplementos", label: "Suplementos" },
  { value: "outros", label: "Outros" },
];

const STATUS = [
  { value: "padrao", label: "Padrão" },
  { value: "novo", label: "Novo" },
  { value: "destaque", label: "Destaque" },
  { value: "oferta", label: "Oferta" },
];

const SIZE_TYPES = [
  { value: "unico", label: "Único" },
  { value: "roupas", label: "Roupas (P/M/G/GG)" },
  { value: "numerico", label: "Numérico (34–46)" },
  { value: "custom", label: "Personalizado" },
];

const CLOTHING_SIZES = ["P", "M", "G", "GG"] as const;

const COLOR_PRESETS: Array<{ name: string; hex: string; aliases: string[] }> = [
  { name: "Preto", hex: "#111111", aliases: ["preto", "preta"] },
  { name: "Branco", hex: "#ffffff", aliases: ["branco", "branca", "off white", "off-white", "offwhite"] },
  { name: "Cinza", hex: "#a1a1aa", aliases: ["cinza", "grafite"] },
  { name: "Bege", hex: "#d8c7a3", aliases: ["bege", "nude", "areia"] },
  { name: "Vermelho", hex: "#dc2626", aliases: ["vermelho", "vermelha"] },
  { name: "Vinho", hex: "#5a1026", aliases: ["vinho", "bordô", "bordo"] },
  { name: "Rosa", hex: "#ec4899", aliases: ["rosa", "pink"] },
  { name: "Roxo", hex: "#7c3aed", aliases: ["roxo", "roxa"] },
  { name: "Lilás", hex: "#a78bfa", aliases: ["lilás", "lilas"] },
  { name: "Azul", hex: "#2563eb", aliases: ["azul", "marinho", "azul marinho", "azul petróleo", "azul petroleo"] },
  { name: "Verde", hex: "#16a34a", aliases: ["verde", "oliva", "verde oliva"] },
];

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(value: string) {
  const normalized = stripDiacritics(String(value || ""))
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return normalized;
}

function normalizeForMatch(value: string) {
  return stripDiacritics(String(value || ""))
    .toLocaleLowerCase("pt-BR")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/g, "")
    .trim();
}

function inferColorSuggestion(name: string, category: string) {
  const cleanedName = String(name || "").trim().replace(/\s+/g, " ");
  const normalizedName = normalizeForMatch(cleanedName);
  if (!normalizedName) return null;

  for (const preset of COLOR_PRESETS) {
    const candidates = [preset.name, ...preset.aliases];
    for (const alias of candidates) {
      const normalizedAlias = normalizeForMatch(alias);
      if (!normalizedAlias) continue;
      if (normalizedName.endsWith(` ${normalizedAlias}`)) {
        const baseName = cleanedName.slice(0, Math.max(0, cleanedName.length - alias.length)).trim().replace(/\s*[-–—]+\s*$/g, "");
        if (!baseName) return null;
        const groupKey = [slugify(baseName), slugify(category)].filter(Boolean).join("-");
        return { groupKey, colorName: preset.name, colorHex: preset.hex, baseName };
      }
    }
  }

  return null;
}

export default function ProductForm({
  draft,
  setDraft,
  errors,
}: {
  draft: DraftProduct;
  setDraft: (next: DraftProduct) => void;
  errors: Record<string, string>;
}) {
  const imageFields = useMemo(
    () => [
      { idx: 0, label: "Imagem principal (URL)" },
      { idx: 1, label: "Imagem 2 (URL)" },
      { idx: 2, label: "Imagem 3 (URL)" },
      { idx: 3, label: "Imagem 4 (URL)" },
      { idx: 4, label: "Imagem 5 (URL)" },
    ],
    []
  );

  function set<K extends keyof DraftProduct>(key: K, value: DraftProduct[K]) {
    setDraft({ ...draft, [key]: value });
  }

  function setImage(index: number, value: string) {
    const next = [...draft.images];
    next[index] = value;
    set("images", next);
  }

  function addAdditionalInfoRow() {
    set("additionalInfo", [...(draft.additionalInfo || []), { label: "", value: "" }]);
  }

  function removeAdditionalInfoRow(index: number) {
    const next = [...(draft.additionalInfo || [])];
    next.splice(index, 1);
    set("additionalInfo", next);
  }

  function setAdditionalInfoLabel(index: number, value: string) {
    const next = [...(draft.additionalInfo || [])];
    const current = next[index] || { label: "", value: "" };
    next[index] = { ...current, label: value };
    set("additionalInfo", next);
  }

  function setAdditionalInfoValue(index: number, value: string) {
    const next = [...(draft.additionalInfo || [])];
    const current = next[index] || { label: "", value: "" };
    next[index] = { ...current, value };
    set("additionalInfo", next);
  }

  const totalSizeStock = useMemo(() => {
    if (!Array.isArray(draft.sizes) || draft.sizes.length === 0) return 0;
    return draft.sizes.reduce((acc, row) => acc + Math.max(0, Math.floor(Number(row.stock || 0))), 0);
  }, [draft.sizes]);

  const colorSuggestion = useMemo(() => inferColorSuggestion(draft.name, draft.category), [draft.category, draft.name]);
  const colorPreviewValue = useMemo(() => {
    const raw = String(draft.colorHex || "").trim();
    if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(raw)) return raw;
    return colorSuggestion?.colorHex || "#111111";
  }, [colorSuggestion?.colorHex, draft.colorHex]);

  function syncSizes(nextSizes: DraftProduct["sizes"]) {
    const cleaned = nextSizes.map((row) => ({
      label: String(row.label || ""),
      stock: Math.max(0, Math.floor(Number(row.stock || 0))),
      sku: row.sku ? String(row.sku) : undefined,
      active: row.active === undefined ? true : Boolean(row.active),
    }));

    const total = cleaned.reduce((acc, row) => acc + Math.max(0, Math.floor(Number(row.stock || 0))), 0);
    const labelSummary = cleaned.map((row) => row.label.trim()).filter(Boolean).join(", ");

    setDraft({
      ...draft,
      sizes: cleaned,
      stock: draft.sizeType === "unico" ? draft.stock : total,
      size: draft.sizeType === "unico" ? draft.size : labelSummary,
    });
  }

  function setSizeType(nextType: DraftProduct["sizeType"]) {
    if (nextType === draft.sizeType) return;

    if (nextType === "unico") {
      setDraft({
        ...draft,
        sizeType: "unico",
        sizes: [],
      });
      return;
    }

    const seedSizes =
      draft.sizes.length > 0
        ? draft.sizes
        : nextType === "roupas"
          ? CLOTHING_SIZES.map((label) => ({ label, stock: 0 }))
          : nextType === "numerico"
            ? Array.from({ length: 7 }).map((_, idx) => ({ label: String(34 + idx * 2), stock: 0 }))
            : [{ label: "", stock: 0 }];

    const labelSummary = seedSizes.map((row) => row.label.trim()).filter(Boolean).join(", ");
    const total = seedSizes.reduce((acc, row) => acc + Math.max(0, Math.floor(Number(row.stock || 0))), 0);

    setDraft({
      ...draft,
      sizeType: nextType,
      sizes: seedSizes,
      size: labelSummary,
      stock: total,
    });
  }

  function addSizeRow() {
    syncSizes([...(draft.sizes || []), { label: "", stock: 0 }]);
  }

  function removeSizeRow(index: number) {
    const next = [...(draft.sizes || [])];
    next.splice(index, 1);
    syncSizes(next);
  }

  function setSizeLabel(index: number, value: string) {
    const next = [...(draft.sizes || [])];
    const current = next[index] || { label: "", stock: 0 };
    next[index] = { ...current, label: value };
    syncSizes(next);
  }

  function setSizeStock(index: number, value: number) {
    const next = [...(draft.sizes || [])];
    const current = next[index] || { label: "", stock: 0 };
    next[index] = { ...current, stock: value };
    syncSizes(next);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label="Nome do produto"
          placeholder="Ex.: Legging Sculpt Seamless"
          value={draft.name}
          onChange={(event) => set("name", event.target.value)}
        />
        <Input label="SKU" placeholder="Ex.: LEG-001" value={draft.sku} onChange={(event) => set("sku", event.target.value)} />
        <Select
          label="Categoria"
          value={draft.category}
          onChange={(event) => set("category", event.target.value)}
          options={CATEGORIES}
        />
        <Select
          label="Status (Novo / Destaque / Oferta)"
          value={draft.status}
          onChange={(event) => set("status", event.target.value as DraftProduct["status"])}
          options={STATUS}
        />

        <Select
          label="Tipo de tamanho (estoque por tamanho)"
          value={draft.sizeType}
          onChange={(event) => setSizeType(event.target.value as DraftProduct["sizeType"])}
          options={SIZE_TYPES}
        />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Variações por cor</p>
              <p className="mt-1 text-xs text-slate-500">
                Use o mesmo <span className="font-semibold text-slate-700">groupKey</span> para produtos do mesmo modelo com cores diferentes.
              </p>
            </div>
            {colorSuggestion && (!draft.groupKey.trim() || !draft.colorName.trim()) ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDraft({
                    ...draft,
                    groupKey: draft.groupKey.trim() ? draft.groupKey : colorSuggestion.groupKey,
                    colorName: draft.colorName.trim() ? draft.colorName : colorSuggestion.colorName,
                    colorHex: draft.colorHex.trim() ? draft.colorHex : colorSuggestion.colorHex,
                  });
                }}
              >
                Aplicar sugestão
              </Button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Input
              label="groupKey (grupo do modelo)"
              placeholder="Ex.: macacao-estilo-fitness-fitness"
              value={draft.groupKey}
              onChange={(event) => set("groupKey", event.target.value)}
              hint="Opcional. Se vazio, o backend tenta inferir pelo nome."
            />
            <Input
              label="Nome da cor"
              placeholder="Ex.: Preto"
              value={draft.colorName}
              onChange={(event) => set("colorName", event.target.value)}
              hint="Opcional. Exibido no seletor de cores."
            />

            <div className="flex items-end gap-3">
              <Input
                label="Hex da cor"
                placeholder="#111111"
                value={draft.colorHex}
                onChange={(event) => set("colorHex", event.target.value)}
                className="flex-1"
                hint="Opcional. Use para o swatch."
              />
              <div className="pb-[2px]">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Preview</span>
                <input
                  type="color"
                  value={colorPreviewValue}
                  onChange={(event) => set("colorHex", event.target.value)}
                  aria-label="Selecionar cor"
                  className={cn(
                    "h-11 w-11 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-1",
                    "shadow-[0_4px_16px_rgba(15,23,42,0.04)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/90",
                  )}
                />
              </div>
            </div>

            {colorSuggestion ? (
              <div className="lg:col-span-3">
                <p className="text-[11px] text-slate-500">
                  Sugestão detectada: <span className="font-semibold text-slate-700">{colorSuggestion.colorName}</span>{" "}
                  (groupKey: <span className="font-semibold text-slate-700">{colorSuggestion.groupKey}</span>)
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {draft.sizeType === "unico" ? (
          <Input
            label="Tamanho (texto livre)"
            placeholder="Ex.: Único"
            value={draft.size}
            onChange={(event) => set("size", event.target.value)}
          />
        ) : (
          <Input
            label="Tamanhos (resumo)"
            value={draft.sizes.map((row) => row.label.trim()).filter(Boolean).join(", ")}
            readOnly
            disabled
            hint="Configure quantidades na seção “Estoque por tamanho” abaixo."
          />
        )}

        {draft.sizeType === "unico" ? (
          <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4 lg:col-span-2">
            <p className="text-sm font-semibold text-slate-900">Estoque por tamanho (opcional)</p>
            <p className="mt-1 text-xs text-slate-500">
              Se o produto tiver variações de tamanho, ative o controle por tamanho agora para cadastrar as quantidades já no modal.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSizeType("roupas")}>
                Ativar P/M/G/GG
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSizeType("numerico")}>
                Ativar 34–46
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSizeType("custom")}>
                Ativar personalizado
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          {draft.sizeType === "unico" ? (
            <Input
              label="Estoque"
              type="number"
              inputMode="numeric"
              min={0}
              value={String(draft.stock)}
              onChange={(event) => set("stock", Number(event.target.value || 0))}
            />
          ) : (
            <Input
              label="Estoque total"
              type="number"
              inputMode="numeric"
              min={0}
              value={String(totalSizeStock)}
              readOnly
              disabled
              hint="Soma do estoque de todos os tamanhos."
            />
          )}
          <Input
            label="Preço atual"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={String(draft.price)}
            onChange={(event) => set("price", Number(event.target.value || 0))}
          />
        </div>

        <Input
          label="Preço anterior (promoção)"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={String(draft.compareAtPrice)}
          onChange={(event) => set("compareAtPrice", Number(event.target.value || 0))}
          hint="Use apenas se houver desconto real."
        />

        <Input
          label="Tags (separe por vírgula)"
          placeholder="Ex.: compressão, alta-cintura, best-seller"
          value={draft.tags}
          onChange={(event) => set("tags", event.target.value)}
        />
      </div>

      <Toggle checked={draft.active} onChange={(value) => set("active", value)} label="Produto ativo no site" />

      {draft.sizeType !== "unico" ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Estoque por tamanho</p>
              <p className="mt-1 text-xs text-slate-500">
                Defina quantidades por tamanho. O estoque total é calculado automaticamente.
              </p>
            </div>
            <Badge tone={totalSizeStock <= 0 ? "danger" : totalSizeStock <= 5 ? "warn" : "success"}>
              Total: {totalSizeStock}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {draft.sizeType === "roupas" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => syncSizes(CLOTHING_SIZES.map((label) => ({ label, stock: 0 })))}
              >
                Preencher P/M/G/GG
              </Button>
            ) : null}
            {draft.sizeType === "numerico" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => syncSizes(Array.from({ length: 7 }).map((_, idx) => ({ label: String(34 + idx * 2), stock: 0 })))}
              >
                Preencher 34–46
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={addSizeRow}>
              Adicionar tamanho
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr className="border-b border-slate-200/70">
                  <th className="px-4 py-3">Tamanho</th>
                  <th className="px-4 py-3">Quantidade</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 bg-white">
                {draft.sizes.map((row, index) => (
                  <tr key={`${row.label}-${index}`} className="transition-colors hover:bg-violet-50/35">
                    <td className="px-4 py-3">
                      <input
                        value={row.label}
                        onChange={(event) => setSizeLabel(index, event.target.value)}
                        placeholder={draft.sizeType === "numerico" ? "Ex.: 38" : "Ex.: M"}
                        className={cn(
                          "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900",
                          "focus:outline-none focus:ring-2 focus:ring-violet-300/90",
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={String(row.stock)}
                        onChange={(event) => setSizeStock(index, Number(event.target.value || 0))}
                        className={cn(
                          "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900",
                          "focus:outline-none focus:ring-2 focus:ring-violet-300/90",
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeSizeRow(index)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/90"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea
          label="Descrição curta (card)"
          placeholder="Resumo objetivo com benefício e diferencial."
          value={draft.shortDescription}
          onChange={(event) => set("shortDescription", event.target.value)}
        />
        <Textarea
          label="Descrição completa (detalhes)"
          placeholder="Detalhes do produto, composição, cuidados, garantia etc."
          value={draft.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Informações adicionais</p>
            <p className="mt-1 text-xs text-slate-500">
              Configure os itens exibidos na aba de informações adicionais da página do produto.
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={addAdditionalInfoRow}>
            Adicionar item
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {draft.additionalInfo.length ? (
            draft.additionalInfo.map((row, index) => (
              <div key={`additional-info-${index}`} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <Input
                  label={index === 0 ? "Rótulo" : undefined}
                  placeholder="Ex.: Composição"
                  value={row.label}
                  onChange={(event) => setAdditionalInfoLabel(index, event.target.value)}
                />
                <Input
                  label={index === 0 ? "Valor" : undefined}
                  placeholder="Ex.: 88% poliamida, 12% elastano"
                  value={row.value}
                  onChange={(event) => setAdditionalInfoValue(index, event.target.value)}
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeAdditionalInfoRow(index)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/90"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nenhum item adicional configurado.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Galeria de imagens (5 URLs)</p>
            <p className="mt-1 text-xs text-slate-500">A primeira é principal. As demais aparecem na galeria de visualização.</p>
          </div>
          <Badge tone={draft.images.filter(Boolean).length >= 1 ? "success" : "warn"}>{draft.images.filter(Boolean).length}/5 preenchidas</Badge>
        </div>

        <div className="mt-4 grid gap-3">
          {imageFields.map((field) => (
            <div key={field.idx} className="grid gap-3 lg:grid-cols-[1fr_140px]">
              <Input
                label={field.label}
                placeholder="https://..."
                value={draft.images[field.idx] || ""}
                onChange={(event) => setImage(field.idx, event.target.value)}
              />
              <div className="flex items-end">
                <div className={cn("h-11 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white")}> 
                  {draft.images[field.idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.images[field.idx]}
                      alt={`Prévia ${field.idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[10px] font-medium text-slate-400">Prévia</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(errors).length ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">Revise os campos</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
            {Object.entries(errors).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
