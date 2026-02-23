import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPost from "@/components/blog/BlogPost";
import { fetchBlogArticleBySlug, fetchRelatedBlogPosts } from "@/lib/blogData";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

function buildBlogPostTitle(articleTitle: string) {
  const suffix = " - Blog Marima: moda fitness e alta performance";
  const maxTotal = 68;
  const maxArticle = Math.max(15, maxTotal - suffix.length);
  const normalizedTitle =
    articleTitle.length > maxArticle
      ? `${articleTitle.slice(0, Math.max(0, maxArticle - 3)).trimEnd()}...`
      : articleTitle;
  return `${normalizedTitle}${suffix}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchBlogArticleBySlug(slug);

  if (!article) {
    return {
      title: "Artigo da Marima: conteudo sobre moda fitness, treino e performance",
    };
  }

  return {
    title: buildBlogPostTitle(article.title),
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await fetchBlogArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await fetchRelatedBlogPosts(slug, 5);

  return (
    <main className="min-h-[60vh] bg-white">
      <BlogPost article={article} related={related} slug={slug} />
    </main>
  );
}
