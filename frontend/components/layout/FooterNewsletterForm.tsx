"use client";

import { useState, type FormEvent } from "react";
import { useNewsletterSubscribe } from "@/lib/useNewsletterSubscribe";

export default function FooterNewsletterForm() {
  const [email, setEmail] = useState("");
  const { isSubmitting, feedback, submit } = useNewsletterSubscribe("footer");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await submit(email);
    if (ok) {
      setEmail("");
    }
  }

  return (
    <>
      <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
        <input
          className="h-10 w-full rounded-full border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-400"
          placeholder="Seu e-mail"
          aria-label="Seu e-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          className="h-10 shrink-0 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : "Inscrever"}
        </button>
      </form>
      {feedback ? (
        <p className="mt-2 text-xs text-zinc-600" role="status" aria-live="polite">
          {feedback.message}
        </p>
      ) : null}
    </>
  );
}
