import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import TrendingProducts from "@/components/home/TrendingProducts";
import PromoBanners from "@/components/home/PromoBanners";
import TopCategories from "@/components/home/TopCategories";
import FeaturesBar from "@/components/home/FeaturesBar";
import BestSelling from "@/components/home/BestSelling";
import DealOfDay from "@/components/home/DealOfDay";
import Reviews from "@/components/home/Reviews";
import Lookbook from "@/components/home/Lookbook";
import CTAWideBanner from "@/components/home/CTAWideBanner";
import InstagramStrip from "@/components/home/InstagramStrip";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Marima Moda Fitness: leggings, tops e conjuntos com conforto premium",
  description:
    "Moda fitness premium com leggings, tops, conjuntos, jaquetas e regatas. Compre na Marima com conforto, performance e entrega com rastreio.",
  pathname: "/",
});

export default function HomePage() {
  return (
    <main className="min-h-[60vh]">
      <Hero />
      <TrendingProducts />
      <PromoBanners />
      <TopCategories />
      <FeaturesBar />
      <BestSelling />

      <div className="mt-10 bg-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="border-t border-zinc-100" />
        </div>
      </div>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-zinc-50 shadow-soft">
            <div className="flex w-[200%] items-center gap-10 px-8 py-5 text-sm text-zinc-600">
              <div className="flex w-1/2 justify-around animate-marquee">
                <span>Bem-vinda à Marima</span>
                <span>Moda fitness com performance</span>
                <span>Conforto e qualidade premium</span>
                <span>Transparência do carrinho à entrega</span>
                <span>Explore nossas novidades</span>
              </div>
              <div className="flex w-1/2 justify-around animate-marquee">
                <span>Bem-vinda à Marima</span>
                <span>Moda fitness com performance</span>
                <span>Conforto e qualidade premium</span>
                <span>Transparência do carrinho à entrega</span>
                <span>Explore nossas novidades</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DealOfDay />
      <Reviews />
      <Lookbook />
      <CTAWideBanner />
      <InstagramStrip />
    </main>
  );
}
