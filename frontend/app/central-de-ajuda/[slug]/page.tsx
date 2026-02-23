import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HelpHero from "@/components/help/HelpHero";
import HelpLayout from "@/components/help/HelpLayout";
import HelpFAQ from "@/components/help/HelpFAQ";
import { resolveHelpTopic, type HelpTopicSlug } from "@/lib/helpData";
import TopicEntrega from "@/components/help/topics/TopicEntrega";
import TopicPrivacidade from "@/components/help/topics/TopicPrivacidade";
import TopicTrocasDevolucoes from "@/components/help/topics/TopicTrocasDevolucoes";
import TopicComoComprar from "@/components/help/topics/TopicComoComprar";
import TopicContato from "@/components/help/topics/TopicContato";

const TOPIC_COMPONENTS: Record<HelpTopicSlug, React.ReactNode> = {
  entrega: <TopicEntrega />,
  privacidade: <TopicPrivacidade />,
  "trocas-e-devolucoes": <TopicTrocasDevolucoes />,
  "como-comprar": <TopicComoComprar />,
  contato: <TopicContato />,
};

function buildHelpTopicTitle(topicTitle: string) {
  const suffix = " na Marima: regras de entrega, trocas e suporte";
  const maxTotal = 68;
  const maxTopic = Math.max(14, maxTotal - suffix.length);
  const normalizedTopic =
    topicTitle.length > maxTopic ? `${topicTitle.slice(0, Math.max(0, maxTopic - 3)).trimEnd()}...` : topicTitle;
  return `${normalizedTopic}${suffix}`;
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = resolveHelpTopic(slug);

  if (!topic) {
    return {
      title: "Central de Ajuda Marima: politicas, entregas, trocas e privacidade",
    };
  }

  return {
    title: buildHelpTopicTitle(topic.title),
  };
}

export default async function HelpTopicPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const topic = resolveHelpTopic(slug);

  if (!topic) {
    notFound();
  }

  const content = TOPIC_COMPONENTS[topic.slug];

  return (
    <main className="min-h-[60vh] bg-white">
      <HelpHero current={{ label: topic.label, title: topic.title }} />

      <HelpLayout active={topic.slug}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{topic.label}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{topic.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{topic.description}</p>
        </div>

        <div className="mt-6">{content}</div>

        <HelpFAQ />
      </HelpLayout>
    </main>
  );
}
