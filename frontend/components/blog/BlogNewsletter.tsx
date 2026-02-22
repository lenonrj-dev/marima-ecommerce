"use client";

import { useState, type FormEvent } from "react";
import Container from "@/components/ui/Container";
import { useNewsletterSubscribe } from "@/lib/useNewsletterSubscribe";

export default function BlogNewsletter() {
  const [email, setEmail] = useState("");
  const { isSubmitting, feedback, submit } = useNewsletterSubscribe("blog");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await submit(email);
    if (ok) {
      setEmail("");
    }
  }

  return (
    <section className="bg-white pb-16 pt-10">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Receba conteudos exclusivos da Marima
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
            Receba os melhores artigos no seu e-mail, sem spam. Voce pode cancelar quando quiser.
          </p>

          <form className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <label className="w-full">
              <span className="sr-only">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Digite seu e-mail"
                className="h-11 w-full rounded-full border border-zinc-200 bg-white px-5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              className="h-11 rounded-full bg-violet-600 px-7 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enviando..." : "Inscrever"}
            </button>
          </form>

          {feedback ? (
            <p className="mt-3 text-xs text-zinc-600" role="status" aria-live="polite">
              {feedback.message}
            </p>
          ) : null}

          <p className="mt-3 text-[11px] text-zinc-500">Conteudo util, direto e sem exageros.</p>
        </div>
      </Container>
    </section>
  );
}
