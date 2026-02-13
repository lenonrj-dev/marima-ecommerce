import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";

export const metadata: Metadata = {
  title: "Blog Marima de Moda Fitness: dicas de treino, estilo e lançamentos",
  description:
    "Artigos sobre Moda Fitness, conforto, tecnologia têxtil e dicas para comprar com segurança na Marima.",
};

export default function BlogPage() {
  return (

    <main className="min-h-[60vh] bg-white">

      <BlogIndex />

    </main>

  );

}

