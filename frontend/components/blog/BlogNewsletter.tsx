"use client";

import Container from "@/components/ui/Container";

export default function BlogNewsletter() {
  return (
    <section className="bg-white pb-16 pt-10">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Receba conteúdos exclusivos da Marima
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
            Receba os melhores artigos no seu e-mail, sem spam. Você pode cancelar quando quiser.
          </p>

          <form className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <label className="w-full">
              <span className="sr-only">E-mail</span>
              <input
                type="email"
                required
                placeholder="Digite seu e-mail"
                className="h-11 w-full rounded-full border border-zinc-200 bg-white px-5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              />
            </label>
            <button
              type="submit"
              className="h-11 rounded-full bg-violet-600 px-7 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Inscrever
            </button>
          </form>

          <p className="mt-3 text-[11px] text-zinc-500">Conteúdo útil, direto e sem exageros.</p>
        </div>
      </Container>
    </section>
  );
}
