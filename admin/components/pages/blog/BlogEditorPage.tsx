"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader } from "../../dashboard/ui";
import { apiFetch, HttpError } from "../../../lib/api";
import type { BlogPost } from "../../../lib/types";
import BlogForm, { type BlogDraft } from "./BlogForm";

const EMPTY_DRAFT: BlogDraft = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  topic: "novidades",
  topic2: "",
  featured: false,
  published: false,
  readingMinutes: "",
  authorName: "",
};

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

function toDraft(post: BlogPost): BlogDraft {
  return {
    title: post.title || "",
    slug: post.slug || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    coverImage: post.coverImage || "",
    tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
    topic: post.topic || "novidades",
    topic2: post.topic2 || "",
    featured: Boolean(post.featured),
    published: Boolean(post.published),
    readingMinutes: post.readingMinutes ? String(post.readingMinutes) : "",
    authorName: post.authorName || "",
  };
}

function toPayload(draft: BlogDraft) {
  const readingMinutes = Number.parseInt(draft.readingMinutes || "", 10);

  return {
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    excerpt: draft.excerpt.trim() || undefined,
    content: draft.content.trim(),
    coverImage: draft.coverImage.trim() || undefined,
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    topic: draft.topic || undefined,
    topic2: draft.topic2 || undefined,
    featured: draft.featured,
    published: draft.published,
    readingMinutes: Number.isFinite(readingMinutes) && readingMinutes > 0 ? readingMinutes : undefined,
    authorName: draft.authorName.trim() || undefined,
  };
}

function validateDraft(draft: BlogDraft) {
  const errors: Record<string, string> = {};

  if (!draft.title.trim()) errors.title = "Informe o titulo do post.";
  if (!draft.slug.trim()) errors.slug = "Informe o slug do post.";
  if (!draft.content.trim()) errors.content = "Informe o conteudo do post.";

  if (draft.readingMinutes.trim()) {
    const parsed = Number.parseInt(draft.readingMinutes, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      errors.readingMinutes = "Tempo de leitura deve ser maior que zero.";
    }
  }

  return errors;
}

export default function BlogEditorPage({ mode, postId }: { mode: "create" | "edit"; postId?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<BlogDraft>(EMPTY_DRAFT);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode !== "edit" || !postId) return;

    let active = true;

    async function loadPost() {
      setLoading(true);
      setErrors({});

      try {
        const response = await apiFetch<{ data: BlogPost }>(`/api/v1/blog/posts/id/${postId}`);
        if (!active) return;

        setDraft(toDraft(response.data));
        setSlugTouched(true);
      } catch (error) {
        if (!active) return;

        if (error instanceof HttpError) {
          setErrors({ global: error.message || "Nao foi possivel carregar o post." });
        } else {
          setErrors({ global: "Nao foi possivel carregar o post." });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      active = false;
    };
  }, [mode, postId]);

  const pageTitle = useMemo(() => (mode === "create" ? "Novo post" : "Editar post"), [mode]);

  function handleTitleChange(value: string) {
    setDraft((previous) => ({
      ...previous,
      title: value,
      slug: slugTouched ? previous.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setDraft((previous) => ({ ...previous, slug: value }));
  }

  async function handleSubmit() {
    const validation = validateDraft(draft);
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const endpoint = mode === "create" ? "/api/v1/blog/posts" : `/api/v1/blog/posts/${postId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      await apiFetch<{ data: BlogPost }>(endpoint, {
        method,
        body: JSON.stringify(toPayload(draft)),
      });

      router.push("/blog");
      router.refresh();
    } catch (error) {
      if (error instanceof HttpError) {
        setErrors({ global: error.message || "Nao foi possivel salvar o post." });
      } else {
        setErrors({ global: "Nao foi possivel salvar o post." });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">Crie e edite artigos conectados ao backend.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/blog")}>Voltar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar post"}
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader title="Conteudo do post" subtitle="Campos principais para publicacao." />
        <CardBody>
          <BlogForm
            draft={draft}
            errors={errors}
            onTitleChange={handleTitleChange}
            onSlugChange={handleSlugChange}
            onChange={setDraft}
          />
        </CardBody>
      </Card>
    </div>
  );
}
