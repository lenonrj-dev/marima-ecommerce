import { MARIMA_INSTITUTIONAL } from "@/lib/institutionalData";

export default function TopicProconRJ() {
  return (
    <article className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Atendimento e transparência</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          A Marima trabalha com políticas claras, comunicação direta e acompanhamento do pedido do
          início ao fim.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">{MARIMA_INSTITUTIONAL.store.title}</h3>
        <p className="mt-2 text-sm text-zinc-600">{MARIMA_INSTITUTIONAL.store.address}</p>
        <p className="mt-1 text-sm text-zinc-600">{MARIMA_INSTITUTIONAL.store.region}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Horário do atendimento</h3>
          <p className="mt-2 text-sm text-zinc-600">{MARIMA_INSTITUTIONAL.store.supportHours}</p>
          <p className="mt-1 text-sm text-zinc-600">{MARIMA_INSTITUTIONAL.store.emailSla}</p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Contato oficial</h3>
          <p className="mt-2 text-sm text-zinc-600">Fale com nosso time pelo e-mail:</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">{MARIMA_INSTITUTIONAL.store.contact}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Compromissos com você</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600">
          {MARIMA_INSTITUTIONAL.about.quickHighlights.map((item) => (
            <li key={item}>⬢ {item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
