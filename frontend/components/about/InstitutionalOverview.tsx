import Container from "@/components/ui/Container";
import { MARIMA_INSTITUTIONAL } from "@/lib/institutionalData";

const indexItems = [
  { id: "sobre-marima", label: "Sobre a Marima" },
  { id: "missao-marima", label: "Missão" },
  { id: "visao-marima", label: "Visão" },
  { id: "valores-marima", label: "Valores" },
  { id: "nossa-loja-marima", label: "Nossa loja" },
];

export default function InstitutionalOverview() {
  return (
    <section className="bg-white py-14 sm:py-16">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Institucional Marima</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {indexItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div id="sobre-marima" className="mt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {MARIMA_INSTITUTIONAL.about.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{MARIMA_INSTITUTIONAL.about.intro}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{MARIMA_INSTITUTIONAL.about.summary}</p>
          </div>

          <div id="missao-marima" className="mt-8">
            <h3 className="text-xl font-semibold text-zinc-900">Missão</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{MARIMA_INSTITUTIONAL.about.mission}</p>
          </div>

          <div id="visao-marima" className="mt-8">
            <h3 className="text-xl font-semibold text-zinc-900">Visão</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{MARIMA_INSTITUTIONAL.about.vision}</p>
          </div>

          <div id="valores-marima" className="mt-8">
            <h3 className="text-xl font-semibold text-zinc-900">Valores</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {MARIMA_INSTITUTIONAL.about.values.map((value) => (
                <article key={value.title} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-zinc-900">{value.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{value.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-zinc-900">Compromissos com você</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {MARIMA_INSTITUTIONAL.about.quickHighlights.map((item) => (
                <li key={item}>⬢ {item}</li>
              ))}
            </ul>
          </div>

          <div id="nossa-loja-marima" className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-zinc-900">{MARIMA_INSTITUTIONAL.store.title}</h3>
            <p className="mt-2 text-sm text-zinc-600">{MARIMA_INSTITUTIONAL.store.address}</p>
            <p className="mt-1 text-sm text-zinc-600">{MARIMA_INSTITUTIONAL.store.region}</p>
            <p className="mt-3 text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">Horário do atendimento:</span>{" "}
              {MARIMA_INSTITUTIONAL.store.supportHours}
            </p>
            <p className="mt-1 text-sm text-zinc-600">{MARIMA_INSTITUTIONAL.store.emailSla}</p>
            <p className="mt-1 text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">Contato:</span>{" "}
              {MARIMA_INSTITUTIONAL.store.contact}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
