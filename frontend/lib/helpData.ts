import {
  BookOpen,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

export type HelpTopicSlug =
  | "entrega"
  | "privacidade"
  | "trocas-e-devolucoes"
  | "como-comprar"
  | "contato";

export type HelpTopic = {
  slug: HelpTopicSlug;
  label: string;
  title: string;
  description: string;
  icon:
    | typeof Truck
    | typeof ShieldCheck
    | typeof RefreshCcw
    | typeof ShoppingBag
    | typeof BookOpen;
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: "entrega",
    label: "Entrega",
    title: "Política de Entrega",
    description:
      "Prazos, modalidades, rastreamento, tentativas de entrega e responsabilidades.",
    icon: Truck,
  },
  {
    slug: "privacidade",
    label: "Privacidade",
    title: "Política de Privacidade (LGPD)",
    description:
      "Como tratamos dados pessoais, cookies, segurança e direitos do titular.",
    icon: ShieldCheck,
  },
  {
    slug: "trocas-e-devolucoes",
    label: "Troca e devolução",
    title: "Troca e devolução",
    description:
      "Condições, prazo de 7 dias corridos (CDC) e fluxo para solicitação.",
    icon: RefreshCcw,
  },
  {
    slug: "como-comprar",
    label: "Como comprar",
    title: "Como comprar na Marima",
    description:
      "Passo a passo para escolher peças, calcular frete e finalizar compra.",
    icon: ShoppingBag,
  },
  {
    slug: "contato",
    label: "Contato",
    title: "Atendimento e transparência",
    description:
      "Canais oficiais, horários, transparência no pedido e contato com suporte.",
    icon: BookOpen,
  },
];

export const HELP_HERO = {
  title: "Central de Ajuda",
  breadcrumb: [
    { label: "Início", href: "/" },
    { label: "Ajuda", href: "/central-de-ajuda" },
  ],
  bgImage:
    "https://res.cloudinary.com/dpyrbbvjd/image/upload/v1768760004/AthleisureBanner_dzhuwp.png",
};

export const HELP_CONTACT_CARD = {
  title: "Fale com a Marima",
  subtitle: "Precisa de suporte agora?",
  phone: "+55 (24) 98146-7489",
  hint: "Seg a Sex, 9h - 18h (exceto feriados)",
  primaryCta: "Falar com suporte",
  primaryHref: "https://wa.me/5524981467489?text=Ola!%20Vim%20pelo%20site%20da%20Marima%20e%20quero%20saber%20das%20promocoes.",
  secondaryCta: "Acompanhar pedido",
  secondaryHref: "/dashboard/pedidos",
};

export const HELP_FAQ = {
  title: "Perguntas frequentes",
  items: [
    {
      q: "Como acompanho meu pedido?",
      a: "Após a confirmação do pagamento, você recebe um e-mail com o código de rastreio. Também é possível acompanhar em Minha conta > Pedidos.",
    },
    {
      q: "Meu pedido atrasou. O que fazer?",
      a: "Verifique primeiro o código de rastreamento. Se o prazo máximo informado já passou, fale com o suporte e envie número do pedido e CEP.",
    },
    {
      q: "Posso trocar tamanho ou cor?",
      a: "Sim. Você pode solicitar troca em até 7 dias corridos após o recebimento, conforme CDC e disponibilidade de estoque.",
    },
    {
      q: "Quais formas de pagamento são aceitas?",
      a: "Cartão, PIX e outras opções podem variar conforme a finalização da compra. Todas as formas disponíveis aparecem ao finalizar o pedido.",
    },
  ],
};

const HELP_TOPIC_ALIASES: Record<string, HelpTopicSlug> = {
  "troca-e-devolucao": "trocas-e-devolucoes",
  "trocas-e-devolucao": "trocas-e-devolucoes",
};

const HELP_TOPIC_MAP = new Map<HelpTopicSlug, HelpTopic>(
  HELP_TOPICS.map((topic) => [topic.slug, topic] as const),
);

export function resolveHelpTopicSlug(rawSlug: string) {
  const slug = rawSlug.trim().toLowerCase();
  const canonical = HELP_TOPIC_ALIASES[slug] ?? slug;
  if (!HELP_TOPIC_MAP.has(canonical as HelpTopicSlug)) return undefined;
  return canonical as HelpTopicSlug;
}

export function resolveHelpTopic(rawSlug: string) {
  const slug = resolveHelpTopicSlug(rawSlug);
  return slug ? HELP_TOPIC_MAP.get(slug) : undefined;
}
