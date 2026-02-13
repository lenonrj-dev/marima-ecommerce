"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import {
  BLOG_TOPICS,
  formatBlogDate,
  getBlogArticle,
  getRelatedPosts,
  topicLabel,
} from "@/lib/blogData";
import { ChevronLeft, Search, Share2 } from "lucide-react";
import BlogReadingShell from "@/components/blog/BlogReadingShell";
import BlogLeftNav from "@/components/blog/BlogLeftNav";
import BlogRightRail from "@/components/blog/BlogRightRail";
import BlogArticleContent from "@/components/blog/BlogArticleContent";

export default function BlogPost({ slug }: { slug: string }) {
  const [query, setQuery] = useState("");

  const article = useMemo(() => getBlogArticle(slug), [slug]);
  const related = useMemo(() => getRelatedPosts(slug), [slug]);

  const activeTopic = article?.topic ?? "novidades";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `${article.title} | Blog Marima`;
    }
  }, [article.title]);

  return (
    <section className="bg-zinc-50/60">
      <Container className="py-8">
        <BlogReadingShell>
          <BlogLeftNav topics={BLOG_TOPICS} activeTopic={activeTopic} />

          <div className="min-w-0">
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar para o blog
              </Link>

              <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 sm:justify-self-end">
                <Search className="h-4 w-4 text-zinc-500" />
                <label className="w-full">
                  <span className="sr-only">Buscar conteúdo</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar conteúdo..."
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </label>
              </div>
            </div>

            <article className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700">
                    {topicLabel(article.topic)}
                  </span>
                  <span aria-hidden>⬢</span>
                  <span>{formatBlogDate(article.dateISO)}</span>
                  <span aria-hidden>⬢</span>
                  <span>{article.readingMinutes} min de leitura</span>
                </div>

                <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                  {article.title}
                </h1>

                <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base">
                  {article.excerpt}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-zinc-600">
                    <span className="font-semibold text-zinc-900">{article.author}</span>
                  </p>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    aria-label="Compartilhar artigo"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && "clipboard" in navigator) {
                        navigator.clipboard.writeText(window.location.href).catch(() => {});
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </button>
                </div>
              </div>

              <div className="relative aspect-[16/7] w-full bg-zinc-100">
                <Image
                  src={article.cover}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 820px, 100vw"
                  priority
                />
              </div>

              <div className="p-6 sm:p-8">
                <BlogArticleContent content={article.content} />

                {article.tags?.length ? (
                  <div className="mt-7 flex flex-wrap items-center gap-2">
                    {article.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={cn("border-t border-zinc-200 bg-white p-5", query && "opacity-90")}>
                <p className="text-xs text-zinc-500">
                  Placeholder técnico: integração futura com busca avançada, comentários e métricas.
                </p>
              </div>
            </article>
          </div>

          <BlogRightRail related={related} />
        </BlogReadingShell>
      </Container>
    </section>
  );
}
