import BlogCard from "@/components/blog/BlogCard";
import type { BlogPostItem } from "@/lib/blogData";

export default function BlogGrid({ posts }: { posts: BlogPostItem[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {posts.map((p) => (
        <BlogCard key={p.slug} post={p} />
      ))}
    </section>
  );
}
