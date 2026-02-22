import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import { ABOUT_COPY } from "@/lib/aboutData";
import {
  fetchBlogPostsForListing,
  formatBlogDate,
  topicLabel,
  type BlogPostItem,
} from "@/lib/blogData";

type PostCardProps = {
  title: string;
  meta: string;
  image: string;
  href: string;
};

function PostCard({ title, meta, image, href }: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 28vw, 100vw"
        />
      </div>

      <div className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{meta}</p>

        <h3 className="text-lg font-semibold leading-snug text-zinc-900">{title}</h3>

        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#e37a33] hover:opacity-90"
        >
          Ler artigo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function buildPostMeta(post: BlogPostItem) {
  const pieces: string[] = [topicLabel(post.topic)];

  if (post.dateISO) {
    const formattedDate = formatBlogDate(post.dateISO);
    if (formattedDate) pieces.push(formattedDate);
  }

  return pieces.join(" • ");
}

export default async function FeaturedPosts() {
  const apiPosts = await fetchBlogPostsForListing({ page: 1, limit: 12 });
  const featuredApiPosts = apiPosts.filter((post) => post.featured);
  const selectedPosts = (featuredApiPosts.length ? featuredApiPosts : apiPosts).slice(0, 3);

  const fallbackPosts = ABOUT_COPY.featuredPosts.posts.map((post) => ({
    id: post.id,
    title: post.title,
    meta: post.meta,
    image: post.image,
    href: "/blog",
  }));

  const cards = selectedPosts.length
    ? selectedPosts.map((post) => ({
        id: post.slug,
        title: post.title,
        meta: buildPostMeta(post),
        image: post.cover,
        href: `/blog/${post.slug}`,
      }))
    : fallbackPosts;

  return (
    <section className="bg-white py-14 sm:py-16">
      <Container className="space-y-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e37a33]">
            {ABOUT_COPY.featuredPosts.kicker}
          </p>

          <h2 className="mt-3 font-serif text-4xl leading-tight text-zinc-900 sm:text-5xl">
            {ABOUT_COPY.featuredPosts.title}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            {ABOUT_COPY.featuredPosts.description}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map((post) => (
            <PostCard key={post.id} title={post.title} meta={post.meta} image={post.image} href={post.href} />
          ))}
        </div>
      </Container>
    </section>
  );
}
