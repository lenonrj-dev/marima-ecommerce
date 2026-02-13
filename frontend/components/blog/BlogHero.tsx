import Container from "@/components/ui/Container";

export default function BlogHero() {
  return (
    <section className="bg-white pt-10 sm:pt-12">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-soft">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-500" aria-hidden />
            Novidades, tendências e guias de Moda Fitness
          </div>

          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Blog Marima: conteúdo para <span className="text-violet-600">treino, estilo e performance</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base">
            Dicas práticas para escolher peças fitness, cuidar dos seus looks e comprar com mais
            segurança.
          </p>

          <div className="mt-8 h-px w-full bg-zinc-200" aria-hidden />
        </div>
      </Container>
    </section>
  );
}
