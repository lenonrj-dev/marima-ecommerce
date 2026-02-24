import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import { fetchBlogPostsListing } from "@/lib/blogData";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog Marima de Moda Fitness: dicas de treino, estilo e lançamentos",
  description:
    "Artigos sobre Moda Fitness, conforto, tecnologia têxtil e dicas para comprar com segurança na Marima.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

function parsePage(raw: string) {
  const parsed = Number(raw || 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const page = parsePage(firstParam(query.page));
  const q = firstParam(query.q);
  const topic = firstParam(query.topic);
  const tags = firstParam(query.tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const rawSort = firstParam(query.sort).toLowerCase();
  const sort = rawSort === "newest" || rawSort === "relevance" ? rawSort : undefined;

  const result = await fetchBlogPostsListing({
    status: "published",
    page,
    limit: 8,
    q: q || undefined,
    topic: topic || undefined,
    tags: tags.length ? tags : undefined,
    sort,
  });

  return (
    <main className="min-h-[60vh] bg-white">
      <BlogIndex
        posts={result.posts}
        activeTopic={topic || "all"}
        page={result.meta.page}
        totalPages={result.meta.pages}
      />
    </main>
  );
}
