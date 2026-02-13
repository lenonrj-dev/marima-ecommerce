"use client";

import Container from "@/components/ui/Container";
import Link from "next/link";
import { ABOUT_COPY } from "@/lib/aboutData";

export default function Newsletter() {
  return (
    <section className="bg-white pb-16 pt-4">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {ABOUT_COPY.newsletter.kicker}
          </p>

          <h2 className="mt-3 font-serif text-3xl leading-tight text-zinc-900 sm:text-4xl">
            {ABOUT_COPY.newsletter.title}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
            {ABOUT_COPY.newsletter.description}
          </p>

          <form
            className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="w-full">
              <span className="sr-only">E-mail</span>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
                required
              />
            </label>

            <button
              type="submit"
              className="h-11 rounded-md bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              Inscrever agora
            </button>
          </form>

          <p className="mt-4 text-xs text-zinc-500">
            Ao se inscrever, você concorda com nossa{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-zinc-900"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
