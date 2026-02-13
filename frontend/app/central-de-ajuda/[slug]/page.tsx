import type { Metadata } from "next";
import HelpHero from "@/components/help/HelpHero";
import HelpLayout from "@/components/help/HelpLayout";
import HelpFAQ from "@/components/help/HelpFAQ";
import { HELP_TOPICS, type HelpTopicSlug } from "@/lib/helpData";
import TopicEntrega from "@/components/help/topics/TopicEntrega";
import TopicPrivacidade from "@/components/help/topics/TopicPrivacidade";
import TopicTrocasDevolucoes from "@/components/help/topics/TopicTrocasDevolucoes";
import TopicComoComprar from "@/components/help/topics/TopicComoComprar";
import TopicProconRJ from "@/components/help/topics/TopicProconRJ";

const TOPIC_COMPONENTS: Record<HelpTopicSlug, React.ReactNode> = {
  entrega: <TopicEntrega />,
  privacidade: <TopicPrivacidade />,
  "trocas-e-devolucoes": <TopicTrocasDevolucoes />,
  "como-comprar": <TopicComoComprar />,
  "procon-rj": <TopicProconRJ />,
};

function buildHelpTopicTitle(topicTitle: string) {
  const suffix = " na Marima: regras de entrega, trocas e suporte";
  const maxTotal = 68;
  const maxTopic = Math.max(14, maxTotal - suffix.length);
  const normalizedTopic =
    topicTitle.length > maxTopic ? `${topicTitle.slice(0, Math.max(0, maxTopic - 3)).trimEnd()}...` : topicTitle;
  return `${normalizedTopic}${suffix}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: HelpTopicSlug };
}): Promise<Metadata> {
  const topic = HELP_TOPICS.find((item) => item.slug === params.slug) ?? HELP_TOPICS[0];

  if (!topic) {
    return {
      title: "Central de Ajuda Marima: políticas, entregas, trocas e privacidade",
    };
  }

  return {
    title: buildHelpTopicTitle(topic.title),
  };
}

export default function HelpTopicPage({
  params,
}: {
  params: { slug: HelpTopicSlug };
}) {
  const topic = HELP_TOPICS.find((item) => item.slug === params.slug) ?? HELP_TOPICS[0];
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
