import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, Sparkles } from "lucide-react";
import { BLOG_AUTHOR, BLOG_POSTS, formatBlogDate, type BlogPostItem } from "@/lib/blogData";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft">
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function BlogSidebar({ posts = BLOG_POSTS }: { posts?: BlogPostItem[] }) {
  const featured = posts.filter((post) => post.featured).slice(0, 3);

  return (
    <div className="sticky top-[96px] space-y-4">
      <Card title="Sobre">
        <div className="flex items-start gap-3">
          <Image
            src={BLOG_AUTHOR.avatar}
            alt={BLOG_AUTHOR.name}
            width={44}
            height={44}
            className="h-11 w-11 rounded-2xl object-cover ring-1 ring-black/10"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{BLOG_AUTHOR.name}</p>
            <p className="text-xs text-zinc-600">{BLOG_AUTHOR.role}</p>

            <div className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-600">
              <MapPin className="h-3.5 w-3.5" />
              {BLOG_AUTHOR.location}
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Conteudos com foco em moda fitness, conforto, tecnologia textil e experiencia de compra transparente.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="mailto:suporte.marima.loja@gmail.com"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Enviar e-mail para suporte"
          >
            <Mail className="h-3.5 w-3.5" />
            Contato
          </Link>

          <Link
            href="/sobre"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Conhecer a Marima"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Sobre
          </Link>
        </div>
      </Card>

      <Card title="Posts em destaque">
        <div className="space-y-3">
          {featured.length ? (
            featured.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-black/5">
                  <Image src={post.cover} alt={post.title} fill className="object-cover" sizes="48px" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-900 group-hover:underline">{post.title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{formatBlogDate(post.dateISO)}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-zinc-600">Nenhum post em destaque ainda.</p>
          )}
        </div>
      </Card>

      <Card title="Destaques Marima">
        <ul className="space-y-2 text-sm text-zinc-700">
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-500" />
            Tecido tecnologico e respirabilidade
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-500" />
            Compressao com conforto real
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-500" />
            Transparencia do pedido ao rastreio
          </li>
        </ul>
      </Card>
    </div>
  );
}
