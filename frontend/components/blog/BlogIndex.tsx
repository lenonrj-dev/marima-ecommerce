"use client";

import { useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import BlogHero from "@/components/blog/BlogHero";
import BlogTopics from "@/components/blog/BlogTopics";
import BlogGrid from "@/components/blog/BlogGrid";
import BlogPagination from "@/components/blog/BlogPagination";
import BlogNewsletter from "@/components/blog/BlogNewsletter";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { BLOG_POSTS, BLOG_TOPICS } from "@/lib/blogData";

export default function BlogIndex() {
  const [topic, setTopic] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const base = topic === "all" ? BLOG_POSTS : BLOG_POSTS.filter((p) => p.topic === topic);
    return base;
  }, [topic]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

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
                onChange={(v) => {
                  setTopic(v);
                  setPage(1);
                }}
              />

              <BlogGrid posts={paged} />
              <BlogPagination page={safePage} totalPages={totalPages} onChange={setPage} />
            </div>

            <div className="lg:pt-1">
              <BlogSidebar />
            </div>
          </div>
        </Container>
      </section>

      <BlogNewsletter />
    </div>
  );
}
