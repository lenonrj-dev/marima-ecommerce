import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlogPostItem } from "@/lib/blogData";
import { formatBlogDate, topicLabel } from "@/lib/blogData";

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-800 ring-1 ring-black/10 backdrop-blur">
      {label}
    </span>
  );
}

export default function BlogCard({ post }: { post: BlogPostItem }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]">
      <Link href={`/blog/${post.slug}`} className="block" aria-label={post.title}>
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 540px, 100vw"
            priority={post.featured}
          />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <Badge label={topicLabel(post.topic)} />
            {post.topic2 ? <Badge label={topicLabel(post.topic2)} /> : null}
          </div>

          <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs text-zinc-500">
            {post.author} <span aria-hidden>&bull;</span> {formatBlogDate(post.dateISO)}
          </p>

          <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug text-zinc-900">{post.title}</h3>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">{post.excerpt}</p>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-violet-700">
            <span
              className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet-200 bg-violet-50")}
              aria-hidden
            >
              &rarr;
            </span>
            Ler artigo
          </div>
        </div>
      </Link>
    </article>
  );
}
