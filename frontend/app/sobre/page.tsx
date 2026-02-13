import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import WhoWeAre from "@/components/about/WhoWeAre";
import BrandDivider from "@/components/about/BrandDivider";
import LatestCollection from "@/components/about/LatestCollection";
import DealOfWeek from "@/components/about/DealOfWeek";
import FeaturedProducts from "@/components/about/FeaturedProducts";
import CTAOrange from "@/components/about/CTAOrange";
import FeaturedPosts from "@/components/about/FeaturedPosts";
import Newsletter from "@/components/about/Newsletter";
import InstitutionalOverview from "@/components/about/InstitutionalOverview";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Conheça a Marima Moda Fitness: qualidade, transparência e envio rápido",
  description:
    "Conheça a Marima, e-commerce de moda fitness com foco em qualidade, conforto, performance, transparência no pedido e atendimento próximo.",
  pathname: "/sobre",
});

export default function SobrePage() {
  return (
    <main className="min-h-[60vh] bg-white">
      <AboutHero />
      <InstitutionalOverview />
      <WhoWeAre />
      <BrandDivider />
      <LatestCollection />
      <DealOfWeek />
      <FeaturedProducts />
      <CTAOrange />
      <FeaturedPosts />
      <Newsletter />
    </main>
  );
}
