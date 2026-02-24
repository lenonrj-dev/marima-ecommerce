"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildLoginUrl } from "@/lib/authSession";
import { apiFetch, HttpError } from "@/lib/api";

type CommentAuthor = {
  id: string;
  name: string;
};

type BlogComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status?: "published" | "hidden" | "pending";
  isOwner: boolean;
  author: CommentAuthor;
  replies?: BlogComment[];
};

type ListCommentsResponse = {
  data: {
    items: BlogComment[];
    nextCursor: string | null;
    hasMore: boolean;
  };
};

type CreateCommentResponse = {
  data: BlogComment;
};

type AuthMeResponse = {
  data: {
    type: "admin" | "customer";
  };
};

function formatCommentDate(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sortByDateAsc(comments: BlogComment[]) {
  return [...comments].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
}

function CommentCard({ comment, nested = false }: { comment: BlogComment; nested?: boolean }) {
  return (
    <article className={nested ? "rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3" : "rounded-xl border border-zinc-200 bg-white px-4 py-4"}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-900">{comment.author.name || "Cliente"}</p>
        <p className="text-xs text-zinc-500">{formatCommentDate(comment.createdAt)}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{comment.content}</p>
      {Array.isArray(comment.replies) && comment.replies.length > 0 ? (
        <div className="mt-3 space-y-2">
          {sortByDateAsc(comment.replies).map((reply) => (
            <CommentCard key={reply.id} comment={reply} nested />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function CommentsSection({ slug }: { slug: string }) {
  const router = useRouter();
  const [items, setItems] = useState<BlogComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCustomer, setIsCustomer] = useState(false);
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const commentsCount = useMemo(() => items.length, [items]);

  const loadComments = useCallback(async (options?: { cursor?: string; append?: boolean }) => {
    const cursor = options?.cursor;
    const append = Boolean(options?.append);

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiFetch<ListCommentsResponse>(`/api/v1/blog/posts/${encodeURIComponent(slug)}/comments`, {
        method: "GET",
        query: {
          limit: 20,
          cursor: cursor || undefined,
        },
        skipAuthRedirect: true,
      });

      const rows = Array.isArray(response?.data?.items) ? response.data.items : [];
      setItems((prev) => (append ? [...prev, ...rows] : rows));
      setNextCursor(response?.data?.nextCursor || null);
      setHasMore(Boolean(response?.data?.hasMore));
    } catch {
      if (!append) {
        setItems([]);
        setNextCursor(null);
        setHasMore(false);
      }
      setFeedback("Não foi possível carregar os comentários agora.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [slug]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      setAuthLoading(true);
      try {
        const me = await apiFetch<AuthMeResponse>("/api/v1/auth/me", {
          method: "GET",
          skipAuthRedirect: true,
        });
        if (!mounted) return;
        setIsCustomer(me?.data?.type === "customer");
      } catch {
        if (!mounted) return;
        setIsCustomer(false);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    void bootstrapAuth();
    void loadComments();

    return () => {
      mounted = false;
    };
  }, [loadComments, slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 3) {
      setFeedback("Escreva ao menos 3 caracteres para comentar.");
      return;
    }

    if (!isCustomer) {
      router.push(buildLoginUrl(`/blog/${slug}`));
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await apiFetch<CreateCommentResponse>(`/api/v1/blog/posts/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: trimmed }),
        skipAuthRedirect: true,
      });

      setContent("");
      setItems((prev) => [response.data, ...prev]);
      setFeedback("Comentário publicado com sucesso.");
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        setIsCustomer(false);
        setFeedback("Entre na sua conta para publicar comentários.");
        return;
      }
      setFeedback("Não foi possível publicar seu comentário agora.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Comentários</h2>
        <span className="text-xs font-semibold text-zinc-500">{commentsCount} publicados</span>
      </div>

      {!authLoading && !isCustomer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-sm text-zinc-700">Entre para comentar nesta postagem.</p>
          <Link
            href={buildLoginUrl(`/blog/${slug}`)}
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            Entrar
          </Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500" htmlFor="blog-comment-content">
          Escreva seu comentário
        </label>
        <textarea
          id="blog-comment-content"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Compartilhe sua opinião sobre este conteúdo."
          className="min-h-[110px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
          maxLength={1000}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">{content.trim().length}/1000</p>
          <button
            type="submit"
            disabled={submitting || authLoading}
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Publicando..." : "Publicar comentário"}
          </button>
        </div>
      </form>

      {feedback ? (
        <p className="text-xs font-semibold text-zinc-700" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-600">Carregando comentários...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-600">Ainda não há comentários nesta postagem.</p>
        ) : (
          items.map((comment) => <CommentCard key={comment.id} comment={comment} />)
        )}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => void loadComments({ cursor: nextCursor || undefined, append: true })}
          disabled={loadingMore}
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingMore ? "Carregando..." : "Carregar mais comentários"}
        </button>
      ) : null}
    </section>
  );
}
