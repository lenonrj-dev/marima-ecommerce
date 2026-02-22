"use client";

import { Input, Select, Textarea, Toggle } from "../../dashboard/ui";

export type BlogDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  topic: string;
  topic2: string;
  featured: boolean;
  published: boolean;
  readingMinutes: string;
  authorName: string;
};

const TOPIC_OPTIONS = [
  { value: "novidades", label: "Novidades" },
  { value: "treino", label: "Treino" },
  { value: "moda-fitness", label: "Moda fitness" },
  { value: "tecnologia-textil", label: "Tecnologia textil" },
  { value: "bem-estar", label: "Bem-estar" },
  { value: "estilo-casual", label: "Estilo casual" },
  { value: "guias", label: "Guias" },
  { value: "marima", label: "Marima" },
];

export default function BlogForm({
  draft,
  errors,
  onTitleChange,
  onSlugChange,
  onChange,
}: {
  draft: BlogDraft;
  errors: Record<string, string>;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onChange: (next: BlogDraft) => void;
}) {
  function setField<K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label="Titulo"
          placeholder="Ex.: Como escolher a legging ideal para cada treino"
          value={draft.title}
          onChange={(event) => onTitleChange(event.target.value)}
        />

        <Input
          label="Slug"
          placeholder="como-escolher-a-legging-ideal"
          value={draft.slug}
          onChange={(event) => onSlugChange(event.target.value)}
          hint="Unico por post. Voce pode editar manualmente."
        />

        <Input
          label="Autor"
          placeholder="Ex.: Time Marima"
          value={draft.authorName}
          onChange={(event) => setField("authorName", event.target.value)}
        />

        <Input
          label="Imagem de capa (URL)"
          placeholder="https://..."
          value={draft.coverImage}
          onChange={(event) => setField("coverImage", event.target.value)}
        />

        <Select
          label="Topico principal"
          value={draft.topic}
          options={TOPIC_OPTIONS}
          onChange={(event) => setField("topic", event.target.value)}
        />

        <Select
          label="Topico secundario"
          value={draft.topic2}
          options={[{ value: "", label: "Nenhum" }, ...TOPIC_OPTIONS]}
          onChange={(event) => setField("topic2", event.target.value)}
        />

        <Input
          label="Tempo de leitura (min)"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Ex.: 5"
          value={draft.readingMinutes}
          onChange={(event) => setField("readingMinutes", event.target.value)}
        />

        <Input
          label="Tags (separadas por virgula)"
          placeholder="Ex.: treino, legging, respirabilidade"
          value={draft.tags}
          onChange={(event) => setField("tags", event.target.value)}
        />

        <div className="lg:col-span-2">
          <Textarea
            label="Resumo / Excerpt"
            placeholder="Resumo curto para o card e SEO social."
            value={draft.excerpt}
            onChange={(event) => setField("excerpt", event.target.value)}
            textareaClassName="min-h-[100px]"
          />
        </div>

        <div className="lg:col-span-2">
          <Textarea
            label="Conteudo"
            placeholder="Digite o conteudo completo (texto/markdown)."
            value={draft.content}
            onChange={(event) => setField("content", event.target.value)}
            textareaClassName="min-h-[260px]"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={draft.published}
          onChange={(next) => setField("published", next)}
          label={draft.published ? "Publicado" : "Rascunho"}
        />
        <Toggle
          checked={draft.featured}
          onChange={(next) => setField("featured", next)}
          label={draft.featured ? "Post em destaque" : "Post comum"}
        />
      </div>

      {errors.global ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errors.global}
        </div>
      ) : null}

      {Object.entries(errors)
        .filter(([key, value]) => key !== "global" && value)
        .map(([key, value]) => (
          <p key={key} className="text-xs text-rose-600">
            {value}
          </p>
        ))}
    </div>
  );
}
