import {
  BookOpen,
  RefreshCcw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

export type HelpTopicSlug =
  | "entrega"
  | "privacidade"
  | "trocas-e-devolucoes"
  | "como-comprar"
  | "procon-rj";

export type HelpTopic = { slug : HelpTopicSlug;
  label: string;
  title: string;
  description: string;
  icon:
    | typeof Truck
    | typeof ShieldCheck
    | typeof RefreshCcw
    | typeof ShoppingBag
    | typeof Scale
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
    slug: "procon-rj",
    label: "Atendimento",
    title: "Atendimento e transparência",
    description:
      "Canais oficiais, horários, transparência no pedido e contato com suporte.",
    icon: Scale,
  },
];

export const HELP_HERO = { title : "Central de Ajuda",
  breadcrumb: [
    { label: "Início", href: "/" },
    { label: "Ajuda", href: "/central-de-ajuda" },
  ],
  bgImage:
    "https://res.cloudinary.com/dpyrbbvjd/image/upload/v1768760004/AthleisureBanner_dzhuwp.png",
};

export const HELP_CONTACT_CARD = { title : "Fale com a Marima",
  subtitle: "Precisa de suporte agora?",
  phone: "+55 (24) 98888-1234",
  hint: "Seg a Sex, 9h - 18h (exceto feriados)",
  primaryCta: "Falar com suporte",
  primaryHref: "mailto:suporte.marima.loja@gmail.com",
  secondaryCta: "Acompanhar pedido",
  secondaryHref: "/dashboard/pedidos",
};

export const HELP_FAQ = { title : "Perguntas frequentes",
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
      q: "Quais formas de pagamento so aceitas?",
      a: "Cartão, PIX e outras opções podem variar conforme a finalização da compra. Todas as formas disponíveis aparecem ao finalizar o pedido.",
    },
  ],
};

