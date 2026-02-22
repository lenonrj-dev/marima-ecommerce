"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "../../dashboard/ui";
import { formatDateShort } from "../../../lib/format";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import type { BlogPost } from "../../../lib/types";

const STATUS_FILTER = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
];

const LOCAL_POST_KEYS = [
  "marima_blog_posts",
  "blog_posts",
  "marima_blog_drafts",
  "marima_posts",
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function toImportPayload(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  const title = typeof source.title === "string" ? source.title.trim() : "";
  const slugRaw = typeof source.slug === "string" ? source.slug.trim() : "";
  const slug = slugify(slugRaw || title);
  const excerpt =
    typeof source.excerpt === "string"
      ? source.excerpt.trim()
      : typeof source.description === "string"
        ? source.description.trim()
        : "";
  const content =
    typeof source.content === "string"
      ? source.content.trim()
      : typeof source.body === "string"
        ? source.body.trim()
        : typeof source.markdown === "string"
          ? source.markdown.trim()
          : "";

  if (!title || !slug || !content) return null;

  const tags = Array.isArray(source.tags)
    ? source.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : [];

  const readingMinutes =
    typeof source.readingMinutes === "number" && Number.isFinite(source.readingMinutes)
      ? Math.max(1, Math.floor(source.readingMinutes))
      : undefined;

  return {
    title,
    slug,
    excerpt: excerpt || undefined,
    content,
    coverImage:
      typeof source.coverImage === "string"
        ? source.coverImage
        : typeof source.cover === "string"
          ? source.cover
          : typeof source.image === "string"
            ? source.image
            : undefined,
    tags,
    topic: typeof source.topic === "string" ? source.topic : undefined,
    topic2: typeof source.topic2 === "string" ? source.topic2 : undefined,
    featured: Boolean(source.featured),
    published:
      typeof source.published === "boolean"
        ? source.published
        : typeof source.status === "string"
          ? source.status.toLocaleLowerCase("pt-BR") === "publicado"
          : false,
    readingMinutes,
    authorName: typeof source.authorName === "string" ? source.authorName : undefined,
  };
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<ApiListResponse<BlogPost>>("/api/v1/blog/posts", {
          query: {
            q: q.trim() || undefined,
            status: status,
            limit: 200,
          },
        });

        if (!active) return;
        setPosts(response.data || []);
      } catch (fetchError) {
        if (!active) return;

        if (fetchError instanceof HttpError) {
          setError(fetchError.message || "Nao foi possivel carregar os posts.");
        } else {
          setError("Nao foi possivel carregar os posts.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      active = false;
    };
  }, [q, status]);

  const totals = useMemo(() => {
    const published = posts.filter((post) => post.published).length;
    return {
      total: posts.length,
      published,
      draft: posts.length - published,
    };
  }, [posts]);

  async function handleTogglePublish(post: BlogPost) {
    setBusyId(post.id);
    setError(null);
    setNotice(null);

    try {
      const response = await apiFetch<{ data: BlogPost }>(`/api/v1/blog/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: !post.published }),
      });

      setPosts((previous) => previous.map((item) => (item.id === post.id ? response.data : item)));
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

  async function handleDelete(post: BlogPost) {
    const ok = window.confirm(`Excluir o post "${post.title}"? Esta acao nao pode ser desfeita.`);
    if (!ok) return;

    setBusyId(post.id);
    setError(null);
    setNotice(null);

    try {
      await apiFetch(`/api/v1/blog/posts/${post.id}`, { method: "DELETE" });
      setPosts((previous) => previous.filter((item) => item.id !== post.id));
    } catch (fetchError) {
      if (fetchError instanceof HttpError) {
        setError(fetchError.message || "Nao foi possivel excluir o post.");
      } else {
        setError("Nao foi possivel excluir o post.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleImportLocalPosts() {
    if (typeof window === "undefined") return;

    setError(null);
    setNotice(null);

    const payloads: ReturnType<typeof toImportPayload>[] = [];
    const usedKeys: string[] = [];

    for (const key of LOCAL_POST_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;

        const mapped = parsed.map(toImportPayload).filter((item): item is NonNullable<typeof item> => item !== null);
        if (!mapped.length) continue;

        payloads.push(...mapped);
        usedKeys.push(key);
      } catch {
        // Ignora entradas invalidas.
      }
    }

    if (!payloads.length) {
      setNotice("Nenhum post local encontrado para importar.");
      return;
    }

    let imported = 0;
    let failed = 0;

    for (const payload of payloads) {
      try {
        await apiFetch<{ data: BlogPost }>("/api/v1/blog/posts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        imported += 1;
      } catch {
        failed += 1;
      }
    }

    if (imported > 0) {
      for (const key of usedKeys) {
        window.localStorage.removeItem(key);
      }
    }

    setNotice(`Importacao concluida: ${imported} importado(s), ${failed} com falha.`);

    try {
      const response = await apiFetch<ApiListResponse<BlogPost>>("/api/v1/blog/posts", {
        query: { limit: 200 },
      });
      setPosts(response.data || []);
    } catch {
      // Mantem a listagem atual se falhar o reload.
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Blog</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie criacao, edicao e publicacao de posts.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleImportLocalPosts}>Importar posts locais</Button>
          <Button variant="primary" onClick={() => window.location.assign("/blog/novo")}>Novo post</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader title="Total" subtitle="Posts cadastrados" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.total}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Publicados" subtitle="Visiveis no blog" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.published}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Rascunhos" subtitle="Ainda nao publicados" />
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{totals.draft}</p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Lista de posts"
          subtitle="Edite, publique e exclua sem sair da dashboard."
          right={<Badge tone={status === "published" ? "success" : status === "draft" ? "warn" : "neutral"}>{STATUS_FILTER.find((item) => item.value === status)?.label || "Todos"}</Badge>}
        />

        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <Input
              aria-label="Buscar post"
              placeholder="Buscar por titulo, slug ou tag..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />

            <Select
              aria-label="Filtrar por status"
              options={STATUS_FILTER}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : posts.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-3">Titulo</th>
                    <th className="py-3 pr-3">Slug</th>
                    <th className="py-3 pr-3">Autor</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3">Atualizado</th>
                    <th className="py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-slate-100 align-top last:border-b-0">
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-slate-900">{post.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{post.excerpt || "Sem resumo"}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">/{post.slug}</td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{post.authorName || "Time Marima"}</td>
                      <td className="py-3 pr-3">
                        <Badge tone={post.published ? "success" : "warn"}>{post.published ? "Publicado" : "Rascunho"}</Badge>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{formatDateShort(post.updatedAt)}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.location.assign(`/blog/editar/${post.id}`)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleTogglePublish(post)}
                            disabled={busyId === post.id}
                          >
                            {post.published ? "Despublicar" : "Publicar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDelete(post)}
                            disabled={busyId === post.id}
                            className="border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100"
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
              Nenhum post encontrado.
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
