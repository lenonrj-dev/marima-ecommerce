import { EXCHANGE_POLICY } from "@/lib/institutionalData";

export default function TopicTrocasDevolucoes() {
  return (
    <article className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{EXCHANGE_POLICY.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{EXCHANGE_POLICY.summary}</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Condições para solicitação</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600">
          {EXCHANGE_POLICY.requirements.map((item) => (
            <li key={item}>⬢ {item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900">Como solicitar</h3>
        <ol className="mt-3 space-y-2 text-sm text-zinc-600">
          {EXCHANGE_POLICY.steps.map((step, idx) => (
            <li key={step}>
              {idx + 1}. {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Regra de frete</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{EXCHANGE_POLICY.freightRule}</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900">Contato</h3>
        <p className="mt-2 text-sm text-zinc-600">Em caso de dúvida, fale com nosso suporte:</p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">{EXCHANGE_POLICY.contact}</p>
      </section>
    </article>
  );
}
