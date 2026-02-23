import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import TrendingProducts from "@/components/home/TrendingProducts";
import PromoBanners from "@/components/home/PromoBanners";
import TopCategories from "@/components/home/TopCategories";
import FeaturesBar from "@/components/home/FeaturesBar";
import BestSelling from "@/components/home/BestSelling";
import DealOfDay from "@/components/home/DealOfDay";
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
      <DealOfDay />

      <Lookbook />
      <CTAWideBanner />
      <InstagramStrip />
    </main>
  );
}
