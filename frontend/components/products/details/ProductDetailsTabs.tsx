"use client";

import { ChevronDown, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HttpError } from "@/lib/api";
import { buildLoginUrl, isAuthenticated } from "@/lib/authSession";
import {
  createProductReview,
  fetchProductReviews,
  fetchProductReviewsSummary,
  type ProductListItem,
  type ProductReview,
  type ProductReviewSort,
  type ProductReviewSummary,
} from "@/lib/productsData";

const REVIEWS_LIMIT = 4;

const EMPTY_SUMMARY: ProductReviewSummary = {
  avgRating: 0,
  total: 0,
  distribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
};

function Stars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1" aria-label={`Avaliação ${full} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < full ? "h-4 w-4 fill-[#d1a35a] text-[#d1a35a]" : "h-4 w-4 text-zinc-300"}
          strokeWidth={1.6}
        />
      ))}
    </div>
  );
}

function formatReviewDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ReviewRow({ review }: { review: ProductReview }) {
  const initial = review.customerName?.trim()?.charAt(0)?.toUpperCase() || "C";

  return (
    <article className="border-b border-zinc-200 py-8 last:border-b-0">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 ring-1 ring-black/10">
            {initial}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">
              {review.customerName || "Cliente"}
              {review.verifiedPurchase && (
                <span className="ml-2 text-xs font-medium text-zinc-500">(Compra verificada)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Stars value={review.rating} />
              <span className="text-sm font-semibold text-zinc-900">{review.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-500">{formatReviewDate(review.createdAt)}</p>
      </div>

      <div className="mt-3 max-w-3xl">
        <p className="text-sm leading-relaxed text-zinc-600">{review.comment}</p>
      </div>
    </article>
  );
}

export default function ProductDetailsTabs({ product }: { product: ProductListItem }) {
  const router = useRouter();
  const [tab, setTab] = useState<"description" | "additional" | "review">("review");
  const [summary, setSummary] = useState<ProductReviewSummary>(() => ({
    avgRating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : 0,
    total: Number.isFinite(Number(product.reviewCount)) ? Number(product.reviewCount) : 0,
    distribution: { ...EMPTY_SUMMARY.distribution },
  }));
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [sort, setSort] = useState<ProductReviewSort>("recent");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: REVIEWS_LIMIT, pages: 1 });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [product.id]);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      setLoadingSummary(true);

      try {
        const nextSummary = await fetchProductReviewsSummary(product.id);
        if (!active) return;
        setSummary(nextSummary);
      } catch {
        if (!active) return;
        setSummary({
          avgRating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : 0,
          total: Number.isFinite(Number(product.reviewCount)) ? Number(product.reviewCount) : 0,
          distribution: { ...EMPTY_SUMMARY.distribution },
        });
      } finally {
        if (active) {
          setLoadingSummary(false);
        }
      }
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [product.id, product.rating, product.reviewCount, reloadTick]);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setLoadingList(true);

      try {
        const response = await fetchProductReviews(product.id, {
          page,
          limit: REVIEWS_LIMIT,
          sort,
        });

        if (!active) return;

        setReviews(response.data);
        setMeta({
          total: response.meta?.total || 0,
          page: response.meta?.page || page,
          limit: response.meta?.limit || REVIEWS_LIMIT,
          pages: response.meta?.pages || 1,
        });
      } catch {
        if (!active) return;

        setReviews([]);
        setMeta({ total: 0, page: 1, limit: REVIEWS_LIMIT, pages: 1 });
      } finally {
        if (active) {
          setLoadingList(false);
        }
      }
    }

    void loadReviews();

    return () => {
      active = false;
    };
  }, [page, product.id, reloadTick, sort]);

  const distribution = useMemo(
    () =>
      ([5, 4, 3, 2, 1] as const).map((stars) => {
        const count = summary.distribution[stars] || 0;
        const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
        return {
          stars,
          count,
          pct,
        };
      }),
    [summary.distribution, summary.total],
  );

  const showing = useMemo(() => {
    if (meta.total === 0 || reviews.length === 0) return { from: 0, to: 0 };
    const from = (meta.page - 1) * meta.limit + 1;
    const to = from + reviews.length - 1;
    return { from, to };
  }, [meta.limit, meta.page, meta.total, reviews.length]);

  async function onSubmitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const comment = formComment.trim();
    if (comment.length < 5) {
      setFormError("Escreva ao menos 5 caracteres para enviar sua avaliação.");
      setFormSuccess(null);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const authed = await isAuthenticated();
      if (!authed) {
        router.push(buildLoginUrl(`/produtos/${product.slug}`));
        return;
      }

      await createProductReview({
        productId: product.id,
        rating: formRating,
        comment,
      });

      setFormComment("");
      setFormRating(5);
      setPage(1);
      setReloadTick((value) => value + 1);
      setFormSuccess("Avaliação enviada com sucesso.");
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        router.push(buildLoginUrl(`/produtos/${product.slug}`));
        return;
      }

      if (error instanceof HttpError) {
        setFormError(error.message || "Não foi possível enviar a avaliação.");
      } else {
        setFormError("Não foi possível enviar a avaliação.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-white pb-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="border-t border-zinc-200 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-10 text-sm font-semibold text-zinc-500">
            <button
              type="button"
              onClick={() => setTab("description")}
              className={
                "relative py-2 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
                (tab === "description" ? "text-zinc-900" : "")
              }
            >
              Descrição
              {tab === "description" && (
                <span className="absolute left-0 right-0 top-full mx-auto mt-2 h-[2px] w-10 bg-zinc-900" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("additional")}
              className={
                "relative py-2 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
                (tab === "additional" ? "text-zinc-900" : "")
              }
            >
              Informações adicionais
              {tab === "additional" && (
                <span className="absolute left-0 right-0 top-full mx-auto mt-2 h-[2px] w-10 bg-zinc-900" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("review")}
              className={
                "relative py-2 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
                (tab === "review" ? "text-zinc-900" : "")
              }
            >
              Avaliações
              {tab === "review" && (
                <span className="absolute left-0 right-0 top-full mx-auto mt-2 h-[2px] w-10 bg-zinc-900" />
              )}
            </button>
          </div>

          <div className="mt-10">
            {tab === "description" && (
              <div className="max-w-4xl text-sm leading-relaxed text-zinc-600">{product.longDescription}</div>
            )}

            {tab === "additional" && (
              <div className="max-w-4xl overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {product.additionalInfo.length ? (
                  <div className="grid divide-y divide-zinc-200 text-sm text-zinc-700">
                    {product.additionalInfo.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="grid grid-cols-2 gap-4 px-4 py-3">
                        <p className="font-medium text-zinc-900">{item.label}</p>
                        <p className="text-zinc-600">{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-sm text-zinc-500">Nenhuma informação adicional para este produto.</div>
                )}
              </div>
            )}

            {tab === "review" && (
              <div className="space-y-10">
                <div className="grid gap-8 rounded-xl border border-zinc-200 bg-white p-6 sm:grid-cols-[280px_1fr]">
                  <div className="flex items-center justify-center gap-6 sm:justify-start">
                    <div className="text-center sm:text-left">
                      <p className="text-4xl font-semibold text-zinc-900">{summary.avgRating.toFixed(1)}</p>
                      <p className="mt-1 text-xs text-zinc-500">de 5</p>
                      <div className="mt-2 flex justify-center sm:justify-start">
                        <Stars value={summary.avgRating} />
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        ({summary.total} avaliação{summary.total === 1 ? "" : "es"})
                      </p>
                      {loadingSummary ? <p className="mt-1 text-xs text-zinc-400">Atualizando...</p> : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {distribution.map((row) => (
                      <div key={row.stars} className="flex items-center gap-3">
                        <p className="w-14 text-xs font-medium text-zinc-600">{row.stars} estrelas</p>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-[#d1a35a]" style={{ width: `${row.pct}%` }} />
                        </div>
                        <p className="w-8 text-right text-xs text-zinc-500">{row.count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={onSubmitReview} className="rounded-xl border border-zinc-200 bg-white p-6">
                  <h3 className="text-base font-semibold text-zinc-900">Escreva sua avaliação</h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
                    <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Nota
                      <select
                        value={formRating}
                        onChange={(event) => setFormRating(Number(event.target.value))}
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                      >
                        <option value={5}>5 estrelas</option>
                        <option value={4}>4 estrelas</option>
                        <option value={3}>3 estrelas</option>
                        <option value={2}>2 estrelas</option>
                        <option value={1}>1 estrela</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Comentário
                      <textarea
                        value={formComment}
                        onChange={(event) => setFormComment(event.target.value)}
                        placeholder="Conte como foi sua experiência com este produto."
                        className="min-h-[110px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                      />
                    </label>
                  </div>

                  {formError ? <p className="mt-3 text-sm font-medium text-rose-600">{formError}</p> : null}
                  {formSuccess ? <p className="mt-3 text-sm font-medium text-emerald-600">{formSuccess}</p> : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Enviando..." : "Enviar avaliação"}
                    </button>
                    <p className="text-xs text-zinc-500">Disponível para clientes com conta logada.</p>
                  </div>
                </form>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">Lista de avaliacoes</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Exibindo {showing.from}-{showing.to} de {meta.total} resultados
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span>Ordenar por</span>
                      <label className="relative">
                        <select
                          value={sort}
                          onChange={(event) => {
                            setSort(event.target.value as ProductReviewSort);
                            setPage(1);
                          }}
                          className="h-9 appearance-none rounded-md border border-zinc-200 bg-white pl-3 pr-9 text-xs font-semibold text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                        >
                          <option value="recent">Mais recentes</option>
                          <option value="oldest">Mais antigas</option>
                          <option value="rating_desc">Maior avaliação</option>
                          <option value="rating_asc">Menor avaliação</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    {loadingList ? (
                      <div className="space-y-3">
                        <div className="h-16 animate-pulse rounded-md bg-zinc-100" />
                        <div className="h-16 animate-pulse rounded-md bg-zinc-100" />
                      </div>
                    ) : reviews.length ? (
                      reviews.map((review) => <ReviewRow key={review.id} review={review} />)
                    ) : (
                      <div className="rounded-md border border-dashed border-zinc-200 px-4 py-5 text-sm text-zinc-500">
                        Ainda não há avaliações publicadas para este produto.
                      </div>
                    )}
                  </div>

                  {meta.pages > 1 ? (
                    <div className="mt-6 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        disabled={meta.page <= 1}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Anterior
                      </button>
                      <span className="text-xs text-zinc-500">
                        Página {meta.page} de {meta.pages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((value) => Math.min(meta.pages, value + 1))}
                        disabled={meta.page >= meta.pages}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Próxima
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
