type PolicySection = {
  title: string;
  paragraphs: string[];
  list?: string[];
};

export default function PolicyArticle({
  title,
  index,
  sections,
}: {
  title: string;
  index: string[];
  sections: PolicySection[];
}) {
  return (
    <article className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Este conteúdo é parte das informações institucionais oficiais da Marima.
        </p>
      </header>

      <nav aria-label={`Índice de ${title}`} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Índice</p>
        <ol className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
          {index.map((item, idx) => (
            <li key={item}>
              <a
                href={`#sec-${idx + 1}`}
                className="inline-flex hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                {idx + 1}. {item}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <section key={section.title} id={`sec-${idx + 1}`} className="scroll-mt-24">
            <h3 className="text-lg font-semibold text-zinc-900">{section.title}</h3>
            <div className="mt-2 space-y-2">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-zinc-600">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.list?.length ? (
              <ul className="mt-3 space-y-1 text-sm text-zinc-600">
                {section.list.map((item) => (
                  <li key={item}>⬢ {item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
