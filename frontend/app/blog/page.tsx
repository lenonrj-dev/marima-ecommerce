import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import { fetchBlogPostsForListing } from "@/lib/blogData";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog Marima de Moda Fitness: dicas de treino, estilo e lancamentos",
  description:
    "Artigos sobre Moda Fitness, conforto, tecnologia textil e dicas para comprar com seguranca na Marima.",
};

export default async function BlogPage() {
  const posts = await fetchBlogPostsForListing();

  return (
    <main className="min-h-[60vh] bg-white">
      <BlogIndex posts={posts} />
    </main>
  );
}
