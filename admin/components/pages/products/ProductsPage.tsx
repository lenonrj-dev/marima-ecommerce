"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import AddProductModal from "./AddProductModal";
import ProductDetailsModal from "./ProductDetailsModal";
import type { DraftProduct } from "./ProductForm";
import ProductTable from "./ProductTable";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import { productStatusLabel, productStatusTone } from "../../../lib/status";
import type { Product } from "../../../lib/types";

const CATEGORY_FILTER = [
  { value: "all", label: "Todas" },
  { value: "fitness", label: "Fitness" },
  { value: "moda", label: "Moda" },
  { value: "casual", label: "Casual" },
  { value: "suplementos", label: "Suplementos" },
  { value: "outros", label: "Outros" },
];

const STATUS_FILTER = [
  { value: "all", label: "Todos" },
  { value: "padrao", label: "Padrão" },
  { value: "novo", label: "Novo" },
  { value: "destaque", label: "Destaque" },
  { value: "oferta", label: "Oferta" },
];

const EMPTY_DRAFT: DraftProduct = {
  name: "",
  sku: "",
  category: "fitness",
  groupKey: "",
  colorName: "",
  colorHex: "",
  size: "",
  sizeType: "unico",
  sizes: [],
  stock: 0,
  price: 0,
  compareAtPrice: 0,
  shortDescription: "",
  description: "",
  additionalInfo: [],
  tags: "",
  status: "padrao",
  active: true,
  images: ["", "", "", "", ""],
};

function toPayload(draft: DraftProduct) {
  const sizes =
    draft.sizeType === "unico"
      ? []
      : (draft.sizes || [])
          .map((row) => ({
            label: String(row.label || "").trim(),
            stock: Math.max(0, Math.floor(Number(row.stock || 0))),
          }))
          .filter((row) => row.label);

  const totalStock = draft.sizeType === "unico" ? Number(draft.stock || 0) : sizes.reduce((acc, row) => acc + row.stock, 0);

  return {
    name: draft.name.trim(),
    sku: draft.sku.trim().toUpperCase(),
    groupKey: draft.groupKey.trim() || undefined,
    colorName: draft.colorName.trim() || undefined,
    colorHex: draft.colorHex.trim() || undefined,
    category: draft.category,
    size: draft.size.trim() || undefined,
    sizeType: draft.sizeType,
    sizes,
    stock: totalStock,
    price: Number(draft.price || 0),
    compareAtPrice: Number(draft.compareAtPrice || 0) || undefined,
    shortDescription: draft.shortDescription.trim(),
    description: draft.description.trim(),
    additionalInfo: (draft.additionalInfo || [])
      .map((item) => ({
        label: String(item.label || "").trim(),
        value: String(item.value || "").trim(),
      }))
      .filter((item) => item.label && item.value),
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: draft.status,
    active: draft.active,
    images: draft.images.map((url) => url.trim()).filter(Boolean).slice(0, 5),
  };
}

function validateDraft(draft: DraftProduct) {
  const errors: Record<string, string> = {};

  if (!draft.name.trim()) errors.name = "Informe o nome do produto.";
  if (!draft.sku.trim()) errors.sku = "Informe o SKU do produto.";
  if (!draft.shortDescription.trim()) errors.shortDescription = "Adicione uma descrição curta para o card.";
  if (!draft.description.trim()) errors.description = "Adicione uma descrição completa.";
  if (Number(draft.price || 0) <= 0) errors.price = "O preço deve ser maior que zero.";

  if (draft.sizeType === "unico") {
    if (Number(draft.stock || 0) < 0) errors.stock = "O estoque não pode ser negativo.";
  } else {
    const normalized = (draft.sizes || [])
      .map((row) => String(row.label || "").trim())
      .filter(Boolean);

    if (!normalized.length) {
      errors.sizes = "Adicione ao menos um tamanho no estoque por tamanho.";
    } else {
      const keys = normalized.map((label) => label.toLocaleLowerCase("pt-BR"));
      const unique = new Set(keys);
      if (unique.size !== keys.length) {
        errors.sizes = "Existem tamanhos duplicados. Revise a lista.";
      }
    }

    const invalidStock = (draft.sizes || []).some((row) => Number(row.stock || 0) < 0);
    if (invalidStock) errors.sizesStock = "O estoque por tamanho não pode ser negativo.";
  }

  if (!draft.images.some((url) => url.trim())) errors.images = "Inclua ao menos uma imagem (URL).";

  return errors;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openNew, setOpenNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [draft, setDraft] = useState<DraftProduct>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [groupKeyFilter, setGroupKeyFilter] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<ApiListResponse<Product>>("/api/v1/admin/products", {
          query: {
            q: q.trim() || undefined,
            category: category !== "all" ? category : undefined,
            groupKey: groupKeyFilter.trim() || undefined,
            status: status !== "all" ? status : undefined,
            limit: 200,
          },
        });

        if (!active) return;
        setProducts(response.data || []);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível carregar produtos.");
        } else {
          setError("Não foi possível carregar produtos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [q, category, groupKeyFilter, status]);

  const totals = useMemo(() => {
    const active = products.filter((product) => product.active).length;
    const lowStock = products.filter((product) => product.stock <= 5).length;
    return { total: products.length, active, lowStock };
  }, [products]);

  function closeCreateModal() {
    setOpenNew(false);
    setErrors({});
    setDraft(EMPTY_DRAFT);
  }

  async function submitCreateProduct() {
    const validation = validateDraft(draft);
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch<{ data: Product }>("/api/v1/admin/products", {
        method: "POST",
        body: JSON.stringify(toPayload(draft)),
      });

      setProducts((previous) => [response.data, ...previous]);
      closeCreateModal();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível criar o produto.");
      } else {
        setError("Não foi possível criar o produto.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-slate-500">Listagem, filtros e cadastro conectados ao backend.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setOpenNew(true)}>
            Adicionar produto
          </Button>
          <Button variant="secondary" onClick={() => window.location.assign("/reports")}>
            Exportar
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Total" subtitle="Produtos cadastrados" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.total}</p>
            <p className="mt-2 text-xs text-slate-500">Ativos: {totals.active}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Ativos" subtitle="Disponíveis no site" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.active}</p>
            <p className="mt-2 text-xs text-slate-500">Desativados: {totals.total - totals.active}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Estoque baixo" subtitle="Reposição recomendada" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.lowStock}</p>
            <p className="mt-2 text-xs text-slate-500">Acompanhe itens com menor giro.</p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Catálogo"
          subtitle="Clique em um produto para abrir detalhes."
          right={
            <div className="hidden items-center gap-2 sm:flex">
              <Badge tone={status !== "all" ? productStatusTone(status as Product["status"]) : "neutral"}>
                {status !== "all" ? productStatusLabel(status as Product["status"]) : "Todos"}
              </Badge>
              <Badge tone={category !== "all" ? "info" : "neutral"}>{category !== "all" ? category : "Todas"}</Badge>
            </div>
          }
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_240px_240px]">
            <Input
              aria-label="Buscar produto"
              placeholder="Buscar nome, descrição ou tag..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <Input
              aria-label="Filtrar por groupKey"
              placeholder="Filtrar por groupKey..."
              value={groupKeyFilter}
              onChange={(event) => setGroupKeyFilter(event.target.value)}
            />
            <Select
              aria-label="Filtrar por categoria"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              options={CATEGORY_FILTER}
            />
            <Select
              aria-label="Filtrar por status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={STATUS_FILTER}
            />
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : (
            <ProductTable products={products} onOpen={(product) => setSelected(product)} />
          )}

          <p className="text-xs text-slate-500">Mostrando {products.length} produtos.</p>
        </CardBody>
      </Card>

      <AddProductModal
        open={openNew}
        onClose={closeCreateModal}
        draft={draft}
        setDraft={setDraft}
        errors={errors}
        onSubmit={submitCreateProduct}
      />
      <ProductDetailsModal
        open={!!selected}
        onClose={() => setSelected(null)}
        product={selected}
        onUpdated={(next) => {
          setProducts((previous) => previous.map((item) => (item.id === next.id ? next : item)));
          setSelected(next);
        }}
        onDeleted={(id) => {
          setProducts((previous) => previous.filter((item) => item.id !== id));
          setSelected(null);
        }}
      />

      {openNew && submitting ? (
        <div className="fixed inset-0 z-[85] grid place-items-center bg-slate-900/20 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">
            Salvando produto...
          </div>
        </div>
      ) : null}
    </div>
  );
}
