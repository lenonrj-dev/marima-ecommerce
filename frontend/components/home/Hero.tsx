import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { Play } from "lucide-react";
import { CLOUD_BANNER } from "@/lib/homeData";
import { SITE_COPY } from "@/lib/siteCopy";

export default function Hero() {
  return (
    <section className="bg-white">
      <Container>
        <div className="overflow-hidden rounded-2xl bg-zinc-100 shadow-soft">
          <div className="grid items-stretch gap-0 lg:grid-cols-12">
            <div className="flex flex-col justify-center px-8 py-10 lg:col-span-7 lg:px-14 lg:py-16">
              <p className="text-sm font-medium text-zinc-600">
                Marima • Moda Fitness com conforto e performance
              </p>

              <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-900 lg:text-6xl">
                Treine com <br /> confiança e estilo.
              </h1>

              <p className="mt-4 max-w-lg text-sm text-zinc-600 sm:text-base">
                Leggings, tops, conjuntos, jaquetas, shorts e regatas com tecido tecnológico,
                compressão na medida certa e durabilidade para sua rotina.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button as={Link} href="/produtos" variant="outline" className="bg-white">
                  {SITE_COPY.ctas.buyNow}
                </Button>

                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2"
                  aria-label="Assistir vídeo da coleção"
                >
                  <Play className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="absolute inset-0 bg-zinc-200/60" />
              <div className="relative h-[320px] w-full lg:h-full">
                <Image
                  src={CLOUD_BANNER}
                  alt="Banner principal da Marima"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}


