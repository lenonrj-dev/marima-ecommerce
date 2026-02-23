"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BlogGrid from "@/components/blog/BlogGrid";
import BlogHero from "@/components/blog/BlogHero";
import BlogNewsletter from "@/components/blog/BlogNewsletter";
import BlogPagination from "@/components/blog/BlogPagination";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogTopics from "@/components/blog/BlogTopics";
import Container from "@/components/ui/Container";
import { BLOG_POSTS, BLOG_TOPICS, type BlogPostItem } from "@/lib/blogData";

type BlogIndexProps = {
  posts?: BlogPostItem[];
  activeTopic?: string;
  page?: number;
  totalPages?: number;
};

export default function BlogIndex({
  posts = BLOG_POSTS,
  activeTopic = "all",
  page = 1,
  totalPages = 1,
}: BlogIndexProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topic = activeTopic || "all";

  function updateSearchParams(patch: { topic?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());

    if (patch.topic !== undefined) {
      if (!patch.topic || patch.topic === "all") {
        params.delete("topic");
      } else {
        params.set("topic", patch.topic);
      }
      params.delete("page");
    }

    if (patch.page !== undefined) {
      if (patch.page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(patch.page));
      }
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      <BlogHero />

      <section className="bg-white">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <BlogTopics
                topics={[{ id: "all", label: "Todos" }, ...BLOG_TOPICS]}
                value={topic}
                onChange={(nextTopic) => {
                  updateSearchParams({ topic: nextTopic, page: 1 });
                }}
              />

              <BlogGrid posts={posts} />
              {posts.length === 0 ? (
                <p className="rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
                  Nenhum post encontrado para este filtro.
                </p>
              ) : null}

              <BlogPagination
                page={Math.max(1, page)}
                totalPages={Math.max(1, totalPages)}
                onChange={(nextPage) => updateSearchParams({ page: nextPage })}
              />
            </div>

            <div className="lg:pt-1">
              <BlogSidebar posts={posts} />
            </div>
          </div>
        </Container>
      </section>

      <BlogNewsletter />
    </div>
  );
}
