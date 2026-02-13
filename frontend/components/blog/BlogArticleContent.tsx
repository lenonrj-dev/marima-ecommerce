export default function BlogArticleContent({
  content,
}: {
  content: Array<
    | { type: "h2"; text: string }
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "quote"; text: string }
  >;
}) {
  return (
    <div className="prose prose-zinc max-w-none">
      {content.map((block, idx) => {
        if (block.type === "h2") {
          return (
            <h2 key={idx} className="mt-7 text-xl font-semibold tracking-tight text-zinc-900">
              {block.text}
            </h2>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={idx}
              className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm leading-relaxed text-zinc-700"
            >
              &ldquo;{block.text}&rdquo;
            </blockquote>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={idx} className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              {block.items.map((it) => (
                <li key={it} className="leading-relaxed">
                  {it}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="mt-4 text-sm leading-relaxed text-zinc-700">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
