import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { CLOUD_BANNER } from "@/lib/homeData";
import { SITE_COPY } from "@/lib/siteCopy";

export default function CTAWideBanner() {
  return (
    <section className="bg-white py-12">
      <Container>
        <div className="group relative overflow-hidden rounded-3xl shadow-soft">
          <div className="absolute inset-0">
            <Image
              src={CLOUD_BANNER}
              alt="Banner da coleção Marima"
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.00]"
            />
          </div>
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
            <p className="text-xs font-medium text-white/80">Marima • Moda Fitness & Casual</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
              Coleção nova com tecnologia têxtil, compressão e conforto premium
            </h3>
            <div className="mt-5">
              <Button
                as={Link}
                href="/produtos"
                variant="outline"
                className="border-white/70 bg-white/95 text-zinc-900 hover:bg-white"
              >
                {SITE_COPY.ctas.exploreNews}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}


