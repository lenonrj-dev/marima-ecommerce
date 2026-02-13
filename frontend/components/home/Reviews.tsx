import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import RatingStars from "@/components/ui/RatingStars";
import { CLOUD_PRODUCT } from "@/lib/homeData";
import Image from "next/image";

function ReviewCard({ name, text, rating }: { name: string; text: string; rating: number }) {
  return (
    <article className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-soft">
      <RatingStars value={rating} />
      <p className="mt-3 text-sm text-zinc-600">{text}</p>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-zinc-100">
          <Image src={CLOUD_PRODUCT} alt={name} fill className="object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{name}</p>
          <p className="text-xs text-zinc-500">Cliente Marima</p>
        </div>
      </div>
    </article>
  );
}

export default function Reviews() {
  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeading
          title="Avaliações de clientes"
          subtitle="Feedback real de quem já comprou e treina com Marima."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <ReviewCard
            name="Carla Souza"
            rating={5}
            text="Qualidade excelente e entrega rápida. O caimento ficou perfeito para treino e dia a dia."
          />
          <ReviewCard
            name="Juliana Nunes"
            rating={5}
            text="Conforto incrível, tecido respirável e acabamento premium. Recomendo muito."
          />
          <ReviewCard
            name="Renata Lima"
            rating={4}
            text="Compra simples, finalização da compra clara e suporte atencioso. Voltarei a comprar."
          />
        </div>
      </Container>
    </section>
  );
}
