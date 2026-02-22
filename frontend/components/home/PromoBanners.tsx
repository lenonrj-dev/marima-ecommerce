import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { SITE_COPY } from "@/lib/siteCopy";

function BannerCard({
  title,
  subtitle,
  imageSrc,
}: {
  title: string;
  subtitle: string;
  imageSrc: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-zinc-900/10">
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
          priority={false}
        />
      </div>

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative flex min-h-[150px] flex-col justify-center px-7 py-6">
        <p className="text-xs font-medium text-white/80">{subtitle}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</p>

        <div className="mt-4">
          <Button
            as={Link}
            href="/produtos"
            variant="outline"
            className="border-white/70 bg-white/95 text-zinc-900 hover:bg-white"
          >
            {SITE_COPY.ctas.viewCollection}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PromoBanners() {
  return (
    <section className="bg-white pb-12">
      <Container>
        <div className="grid gap-6 lg:grid-cols-3">
          <BannerCard
            title="Coleção Performance"
            subtitle="Moda Fitness 2026"
            imageSrc="https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771270603/Perfomance_ql3n7j.png"
          />
          <BannerCard
            title="Até 25% OFF"
            subtitle="Ofertas selecionadas"
            imageSrc="https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771269913/Colecao_adccmn.png"
          />
          <BannerCard
            title="Explorar novidades"
            subtitle="Lançamentos da semana"
            imageSrc="https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771270497/Ofertas_wtxito.png"
          />
        </div>
      </Container>
    </section>
  );
}
