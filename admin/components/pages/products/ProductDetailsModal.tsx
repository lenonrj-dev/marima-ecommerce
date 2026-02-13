"use client";

import { useEffect, useState } from "react";
import Modal from "../../dashboard/Modal";
import { Badge, Button, Card, CardBody, Divider } from "../../dashboard/ui";
import { formatBRL, formatCategoryLabel, formatDateShort } from "../../../lib/format";
import { apiFetch, HttpError } from "../../../lib/api";
import { productStatusLabel, productStatusTone } from "../../../lib/status";
import type { Product } from "../../../lib/types";
import ProductForm, { type DraftProduct } from "./ProductForm";

type Mode = "view" | "edit";

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
  tags: "",
  status: "padrao",
  active: true,
  images: ["", "", "", "", ""],
};

function toDraft(product: Product): DraftProduct {
  const images = Array.isArray(product.images) ? [...product.images] : [];
  while (images.length < 5) images.push("");

  const sizes = Array.isArray(product.sizes)
    ? product.sizes.map((row) => ({
        label: String(row.label || "").trim(),
        stock: Math.max(0, Math.floor(Number(row.stock || 0))),
      }))
    : [];

  const sizeType = product.sizeType || (sizes.length ? "custom" : "unico");
  const totalStock = sizeType === "unico" ? Number(product.stock || 0) : sizes.reduce((acc, row) => acc + row.stock, 0);
  const sizeText = product.size || (sizes.length ? sizes.map((row) => row.label).join(", ") : "");

  return {
    name: product.name || "",
    sku: product.sku || "",
    category: (product.category === "acessorios" ? "casual" : product.category) || "fitness",
    groupKey: product.groupKey || "",
    colorName: product.colorName || "",
    colorHex: product.colorHex || "",
    size: sizeText,
    sizeType,
    sizes,
    stock: totalStock,
    price: Number(product.price || 0),
    compareAtPrice: Number(product.compareAtPrice || 0),
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    status: product.status,
    active: Boolean(product.active),
    images: images.slice(0, 5),
  };
}

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

export default function ProductDetailsModal({
  open,
  onClose,
  product,
  onUpdated,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdated?: (next: Product) => void;
  onDeleted?: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<DraftProduct>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !product) return;
    setMode("view");
    setDraft(toDraft(product));
    setErrors({});
    setApiError(null);
    setSaving(false);
    setToggling(false);
    setDeleting(false);
  }, [open, product]);

  if (!product) return null;

  const productId = product.id;
  const productActive = product.active;
  const productName = product.name;

  async function handleSave() {
    const validation = validateDraft(draft);
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    setSaving(true);
    setApiError(null);
    setErrors({});

    try {
      const response = await apiFetch<{ data: Product }>(`/api/v1/admin/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(toPayload(draft)),
      });

      onUpdated?.(response.data);
      setDraft(toDraft(response.data));
      setMode("view");
    } catch (err) {
      if (err instanceof HttpError) {
        setApiError(err.message || "Não foi possível salvar o produto.");
      } else {
        setApiError("Não foi possível salvar o produto.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    setToggling(true);
    setApiError(null);

    try {
      const response = await apiFetch<{ data: Product }>(`/api/v1/admin/products/${productId}/activation`, {
        method: "PATCH",
        body: JSON.stringify({ active: !productActive }),
      });

      onUpdated?.(response.data);
      setDraft(toDraft(response.data));
    } catch (err) {
      if (err instanceof HttpError) {
        setApiError(err.message || "Não foi possível atualizar o status do produto.");
      } else {
        setApiError("Não foi possível atualizar o status do produto.");
      }
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      `Tem certeza que deseja excluir o produto \"${productName}\"?\n\nEsta ação não pode ser desfeita.`,
    );
    if (!ok) return;

    setDeleting(true);
    setApiError(null);

    try {
      await apiFetch(`/api/v1/admin/products/${productId}`, { method: "DELETE" });
      onDeleted?.(productId);
      onClose();
    } catch (err) {
      if (err instanceof HttpError) {
        setApiError(err.message || "Não foi possível excluir o produto.");
      } else {
        setApiError("Não foi possível excluir o produto.");
      }
    } finally {
      setDeleting(false);
    }
  }

  const footer =
    mode === "edit" ? (
      <>
        <Button
          variant="ghost"
          onClick={() => {
            setMode("view");
            setDraft(toDraft(product));
            setErrors({});
            setApiError(null);
          }}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setMode("edit");
            setDraft(toDraft(product));
            setErrors({});
            setApiError(null);
          }}
        >
          Editar
        </Button>
        <Button variant="secondary" onClick={handleToggleActive} disabled={toggling}>
          {toggling ? "Atualizando..." : productActive ? "Desativar" : "Ativar"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleDelete}
          disabled={deleting}
          className="border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100"
        >
          {deleting ? "Excluindo..." : "Excluir"}
        </Button>
      </>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product.name}
      description={product.shortDescription}
      size="xl"
      footer={footer}
    >
      <div className="space-y-5">
        {apiError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {apiError}
          </div>
        ) : null}

        {mode === "edit" ? (
          <ProductForm draft={draft} setDraft={setDraft} errors={errors} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={productStatusTone(product.status)}>{productStatusLabel(product.status)}</Badge>
              <Badge tone={product.active ? "success" : "neutral"}>{product.active ? "Ativo" : "Inativo"}</Badge>
              <Badge tone={product.stock <= 5 ? "warn" : "neutral"}>Estoque: {product.stock}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardBody>
                  <p className="text-xs text-slate-500">Preço atual</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{formatBRL(product.price)}</p>
                  {product.compareAtPrice ? (
                    <p className="mt-1 text-sm text-slate-400 line-through">{formatBRL(product.compareAtPrice)}</p>
                  ) : null}
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-xs text-slate-500">Atualizado</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateShort(product.updatedAt)}</p>
                  <p className="mt-2 text-xs text-slate-500">Categoria: {formatCategoryLabel(product.category)}</p>
                  <p className="text-xs text-slate-500">
                    Tamanho:{" "}
                    {(() => {
                      if (product.sizeType === "unico") return product.size || "Único";
                      if (Array.isArray(product.sizes) && product.sizes.length) {
                        const rows = product.sizes.filter((row) => row.active !== false);
                        return rows.map((row) => `${row.label}:${row.stock}`).join(" ") || product.size || "—";
                      }
                      return product.size || "—";
                    })()}
                  </p>
                </CardBody>
              </Card>
            </div>

            <Divider />

            <div>
              <p className="text-sm font-semibold text-slate-900">Descrição completa</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{product.description}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Galeria de imagens</p>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {product.images?.map((src, index) => (
                  <div
                    key={index}
                    className="aspect-square overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Imagem ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
