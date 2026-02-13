import type { Metadata } from "next";
import BlogPost from "@/components/blog/BlogPost";
import { getBlogArticle } from "@/lib/blogData";

function buildBlogPostTitle(articleTitle: string) {
  const suffix = " — Blog Marima: moda fitness e alta performance";
  const maxTotal = 68;
  const maxArticle = Math.max(15, maxTotal - suffix.length);
  const normalizedTitle =
    articleTitle.length > maxArticle
      ? `${articleTitle.slice(0, Math.max(0, maxArticle - 3)).trimEnd()}...`
      : articleTitle;
  return `${normalizedTitle}${suffix}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = getBlogArticle(params.slug);

  if (!article) {
    return {
      title: "Artigo da Marima: conteúdo sobre moda fitness, treino e performance",
    };
  }

  return {
    title: buildBlogPostTitle(article.title),
  };
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <main className="min-h-[60vh] bg-white">
      <BlogPost slug={params.slug} />
    </main>
  );
}
