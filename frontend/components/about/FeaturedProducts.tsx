import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import ProductCard from "@/components/ui/ProductCard";
import { ABOUT_COPY, ABOUT_IMAGES } from "@/lib/aboutData";
import { fetchStoreProducts } from "@/lib/productsData";

export default async function FeaturedProducts() {
  const response = await fetchStoreProducts({ limit: 60, includeVariants: true });
  const pool = response.data || [];
  const bestSelling = pool.filter((product) => product.tags?.includes("best-seller"));
  const featured = (bestSelling.length ? bestSelling : pool).slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-16">
      <Container className="space-y-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e37a33]">
            {ABOUT_COPY.featuredProducts.kicker}
          </p>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-zinc-900 sm:text-5xl">
            {ABOUT_COPY.featuredProducts.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            {ABOUT_COPY.featuredProducts.description}
          </p>
        </div>

        
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
            <div className="relative flex-1 bg-zinc-100">
              <Image
                src="https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771279097/GAB08736_diztda.png"
                alt="Destaque de produtos Marima"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 28vw, 100vw"
                priority={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/10" aria-hidden />
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {ABOUT_COPY.featuredProducts.leftCard.eyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {ABOUT_COPY.featuredProducts.leftCard.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {ABOUT_COPY.featuredProducts.leftCard.description}
              </p>

              <Link
                href="/produtos"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#e37a33] hover:opacity-90"
              >
                Comprar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} href={`/produtos/${product.slug}`} />
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            {ABOUT_COPY.featuredProducts.cta}
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e37a33] text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
