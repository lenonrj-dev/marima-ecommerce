"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import { formatBRL, formatCategoryLabel, formatDateShort } from "../../../lib/format";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import { productStatusLabel, productStatusTone } from "../../../lib/status";

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  status: "padrao" | "novo" | "destaque" | "oferta";
  shortDescription: string;
  sizeType?: "roupas" | "numerico" | "unico" | "custom";
  sizes?: Array<{ label: string; stock: number; sku?: string; active?: boolean }>;
  stock: number;
  price: number;
  updatedAt: string;
  tags: string[];
  active: boolean;
};

const CATEGORY_FILTER = [
  { value: "all", label: "Todas" },
  { value: "fitness", label: "Fitness" },
  { value: "moda", label: "Moda" },
  { value: "casual", label: "Casual" },
  { value: "suplementos", label: "Suplementos" },
  { value: "outros", label: "Outros" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<ApiListResponse<InventoryItem>>("/api/v1/admin/inventory/items", {
        query: {
          q: q.trim() || undefined,
          category: category !== "all" ? category : undefined,
          limit: 300,
        },
      });

      setItems(response.data || []);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível carregar o inventário.");
      } else {
        setError("Não foi possível carregar o inventário.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category]);

  const stats = useMemo(() => {
    const total = items.length;
    const low = items.filter((product) => product.stock <= 5).length;
    const out = items.filter((product) => product.stock <= 0).length;
    return { total, low, out };
  }, [items]);

  async function handleAdjust(product: InventoryItem) {
    const sizeRows =
      product.sizeType !== "unico" && Array.isArray(product.sizes)
        ? product.sizes.filter((row) => row.active !== false)
        : [];

    let sizeLabel: string | undefined;
    if (sizeRows.length) {
      const options = sizeRows.map((row) => `${row.label}:${row.stock}`).join(" | ");

      const picked = window.prompt(
        `Qual tamanho deseja ajustar para ${product.name}?\n\n${options || "Sem tamanhos cadastrados"}`,
        sizeRows[0]?.label || "",
      );
      if (!picked) return;
      sizeLabel = picked.trim();
      if (!sizeLabel) return;
    }

    const value = window.prompt(`Ajuste de estoque para ${product.name}.\nUse positivo para entrada e negativo para saída.`);
    if (!value) return;

    const quantity = Math.trunc(Number(value));
    if (!Number.isFinite(quantity) || quantity === 0) {
      window.alert("Informe um número inteiro diferente de zero.");
      return;
    }

    const reason = window.prompt("Motivo do ajuste", "Ajuste manual no painel") || "Ajuste manual no painel";

    const type = quantity > 0 ? "entrada" : "saida";

    setAdjustingId(product.id);
    setError(null);

    try {
      await apiFetch("/api/v1/admin/inventory/adjustments", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          type,
          quantity: Math.abs(quantity),
          reason,
          sizeLabel,
        }),
      });

      await loadData();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível ajustar o estoque.");
      } else {
        setError("Não foi possível ajustar o estoque.");
      }
    } finally {
      setAdjustingId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Estoque</h1>
          <p className="mt-1 text-sm text-slate-500">Controle de inventário, alertas e reposição.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.location.assign("/reports")}>Relatórios</Button>
          <Button variant="primary" onClick={() => loadData()}>Sincronizar</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Total" subtitle="SKUs" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Estoque baixo" subtitle="≤ 5 unidades" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.low}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Sem estoque" subtitle="Zerado" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{stats.out}</p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Inventário"
          subtitle="Busque e filtre produtos por categoria."
          right={
            <div className="flex items-center gap-2">
              <Badge tone="neutral">Backend</Badge>
              <Button variant="primary" size="sm" onClick={() => (window.location.href = "/products")}>Ir para produtos</Button>
            </div>
          }
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_260px]">
            <Input
              aria-label="Buscar no estoque"
              placeholder="Buscar por produto, SKU ou tag..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <Select
              aria-label="Filtrar por categoria"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              options={CATEGORY_FILTER}
            />
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-table text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr className="border-b border-slate-200/70">
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Preço</th>
                    <th className="px-4 py-3">Estoque</th>
                    <th className="px-4 py-3">Atualizado</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {items.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-violet-50/35">
                      <td data-label="Produto" className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.shortDescription}</p>
                      </td>
                      <td data-label="SKU" className="px-4 py-3 text-slate-700">{product.sku}</td>
                      <td data-label="Categoria" className="px-4 py-3 text-slate-700">{formatCategoryLabel(product.category)}</td>
                      <td data-label="Status" className="px-4 py-3">
                        <Badge tone={productStatusTone(product.status)}>{productStatusLabel(product.status)}</Badge>
                      </td>
                      <td data-label="Preço" className="px-4 py-3 text-slate-700">{formatBRL(product.price)}</td>
                      <td data-label="Estoque" className="px-4 py-3">
                        <Badge tone={product.stock <= 0 ? "danger" : product.stock <= 5 ? "warn" : "success"}>{product.stock}</Badge>
                      </td>
                      <td data-label="Atualizado" className="px-4 py-3 text-slate-500">{formatDateShort(product.updatedAt)}</td>
                      <td data-label="Ações" className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleAdjust(product)}
                          disabled={adjustingId === product.id}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          {adjustingId === product.id ? "Ajustando..." : "Ajustar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
