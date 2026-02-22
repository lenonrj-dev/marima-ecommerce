"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import { formatDateShort } from "../../../lib/format";
import type { ProductReview, ReviewStatus } from "../../../lib/types";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";

const STATUS_FILTER = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicadas" },
  { value: "pending", label: "Pendentes" },
  { value: "hidden", label: "Ocultas" },
];

function statusLabel(status: ReviewStatus) {
  if (status === "published") return "Publicada";
  if (status === "pending") return "Pendente";
  return "Oculta";
}

function statusTone(status: ReviewStatus) {
  if (status === "published") return "success" as const;
  if (status === "pending") return "warn" as const;
  return "neutral" as const;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<ApiListResponse<ProductReview>>("/api/v1/admin/reviews", {
          query: {
            q: q.trim() || undefined,
            productId: productId.trim() || undefined,
            status,
            limit: 200,
          },
        });

        if (!active) return;
        setReviews(response.data || []);
      } catch (fetchError) {
        if (!active) return;

        if (fetchError instanceof HttpError) {
          setError(fetchError.message || "Nao foi possivel carregar as avaliacoes.");
        } else {
          setError("Nao foi possivel carregar as avaliacoes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReviews();

    return () => {
      active = false;
    };
  }, [productId, q, status]);

  const totals = useMemo(() => {
    const published = reviews.filter((item) => item.status === "published").length;
    const pending = reviews.filter((item) => item.status === "pending").length;
    const hidden = reviews.filter((item) => item.status === "hidden").length;
    return {
      total: reviews.length,
      published,
      pending,
      hidden,
    };
  }, [reviews]);

  async function updateStatus(reviewId: string, nextStatus: ReviewStatus) {
    setBusyId(reviewId);
    setError(null);

    try {
      const response = await apiFetch<{ data: ProductReview }>(`/api/v1/admin/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setReviews((previous) => previous.map((item) => (item.id === reviewId ? response.data : item)));
    } catch (fetchError) {
      if (fetchError instanceof HttpError) {
        setError(fetchError.message || "Nao foi possivel atualizar o status.");
      } else {
        setError("Nao foi possivel atualizar o status.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteReview(reviewId: string) {
    const ok = window.confirm("Excluir esta avaliacao? Esta acao nao pode ser desfeita.");
    if (!ok) return;

    setBusyId(reviewId);
    setError(null);

    try {
      await apiFetch(`/api/v1/admin/reviews/${reviewId}`, { method: "DELETE" });
      setReviews((previous) => previous.filter((item) => item.id !== reviewId));
    } catch (fetchError) {
      if (fetchError instanceof HttpError) {
        setError(fetchError.message || "Nao foi possivel excluir a avaliacao.");
      } else {
        setError("Nao foi possivel excluir a avaliacao.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Avaliacoes</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie publicacao, ocultacao e exclusao de avaliacoes.</p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader title="Total" subtitle="Avaliacoes cadastradas" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Publicadas" subtitle="Visiveis no site" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.published}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Pendentes" subtitle="Aguardando moderacao" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.pending}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Ocultas" subtitle="Nao exibidas no frontend" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.hidden}</p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader title="Lista de avaliacoes" subtitle="Filtre por produto, cliente ou comentario." />
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px_220px]">
            <Input
              aria-label="Buscar avaliacao"
              placeholder="Buscar por cliente, e-mail, produto ou comentario..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <Input
              aria-label="Filtrar por produto"
              placeholder="ID ou slug do produto"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
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
          ) : reviews.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-3">Produto</th>
                    <th className="py-3 pr-3">Cliente</th>
                    <th className="py-3 pr-3">Nota</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3">Data</th>
                    <th className="py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className="border-b border-slate-100 align-top last:border-b-0">
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-slate-900">{review.productTitle}</p>
                        <p className="mt-1 text-xs text-slate-500">{review.productSlug}</p>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600">{review.comment}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-slate-900">{review.customerName || "Cliente"}</p>
                        <p className="mt-1 text-xs text-slate-500">{review.customerEmail || "-"}</p>
                        {review.verifiedPurchase ? (
                          <Badge tone="info" className="mt-2">
                            Compra verificada
                          </Badge>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3 text-sm font-semibold text-slate-800">{review.rating.toFixed(1)}</td>
                      <td className="py-3 pr-3">
                        <Badge tone={statusTone(review.status)}>{statusLabel(review.status)}</Badge>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{formatDateShort(review.createdAt)}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(review.id, "published")}
                            disabled={busyId === review.id || review.status === "published"}
                          >
                            Publicar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(review.id, "hidden")}
                            disabled={busyId === review.id || review.status === "hidden"}
                          >
                            Ocultar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(review.id, "pending")}
                            disabled={busyId === review.id || review.status === "pending"}
                          >
                            Pendente
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            onClick={() => deleteReview(review.id)}
                            disabled={busyId === review.id}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Nenhuma avaliacao encontrada para os filtros atuais.
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
