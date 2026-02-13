import { CLOUD_BANNER, CLOUD_PRODUCT } from "@/lib/homeData";

export const ABOUT_IMAGES = {
  heroMain: CLOUD_BANNER,
  heroSmall: CLOUD_PRODUCT,
  whoMain: CLOUD_BANNER,
  whoSide: CLOUD_PRODUCT,
  collectionMain: CLOUD_BANNER,
  dealLeft: CLOUD_BANNER,
  dealRight: CLOUD_BANNER,
  featuredLeft: CLOUD_BANNER,
  ctaLeft: CLOUD_PRODUCT,
  ctaRight: CLOUD_PRODUCT,
};

export const ABOUT_COPY = {
  hero: {
    title: "Marima\nModa Fitness\n& Casual",
    description:
      "A Marima é um e-commerce de Moda Fitness. Nossa promessa é simples: produtos de alta qualidade, experiência de compra fluida e comunicação transparente do início ao fim.",
    primaryCta: "Ver coleção",
    secondaryCta: "Explorar novidades",
    badge: "DESDE\n2025\n100+",
  },
  who: {
    eyebrow: "SOBRE A MARIMA",
    description:
      "Qualidade, conforto e transparência em cada pedido. Operamos com processos auditáveis, parceiros logísticos confiáveis e uma jornada pensada para reduzir atritos e aumentar a sua segurança.",
    heading: "Missão, visão e valores que movem a Marima",
    readMore: "VER DETALHES",
    bullets: [
      "Missão: inspirar saúde e confiança com peças funcionais e atendimento próximo.",
      "Visão: ser referência nacional em Moda Fitness & Casual com inovação e acessibilidade.",
      "Valores: transparência, qualidade e suporte ágil em todos os canais.",
    ],
  },
  collection: {
    kicker: "MARIMA ⬢ MODA FITNESS",
    title: "Coleções pensadas para treino e rotina",
    description:
      "Leggings, tops, conjuntos, jaquetas, shorts e regatas com foco em conforto, performance, respirabilidade e durabilidade.",
    chips: ["Leggings", "Tops", "Conjuntos", "Jaquetas", "Shorts", "Regatas", "Casual"],
    link: "VER COLE??O COMPLETA",
  },
  deal: {
    title: "Benefícios que acompanham você",
    description:
      "Transparência no pedido, rastreio, suporte próximo e frete rápido para a Região Sul Fluminense.",
    countdown: {
      days: "02",
      hours: "07",
      mins: "18",
      secs: "24",
    },
  },
  featuredProducts: {
    kicker: "DESTAQUES MARIMA",
    title: "Peças em alta para sua performance",
    description:
      "Curadoria com tecnologia têxtil, compressão estratégica e caimento que valoriza seu movimento.",
    cta: "Explorar novidades",
    leftCard: {
      eyebrow: "MODA FITNESS",
      title: "Conforto e segurança do treino ao casual",
      description:
        "Peças versáteis para academia, caminhada e dia a dia, com acabamento premium e toque macio.",
    },
    items: [
      {
        id: "p1",
        title: "Legging Compressão Pro",
        price: 149.9,
        oldPrice: 199.9,
        rating: 4.8,
        isNew: true,
        image: CLOUD_PRODUCT,
      },
      {
        id: "p2",
        title: "Top Move Alta Sustentação",
        price: 99.9,
        oldPrice: 129.9,
        rating: 4.7,
        isNew: false,
        image: CLOUD_PRODUCT,
      },
      {
        id: "p3",
        title: "Conjunto Sculpt Fit",
        price: 229.9,
        oldPrice: 279.9,
        rating: 4.9,
        isNew: true,
        image: CLOUD_PRODUCT,
      },
      {
        id: "p4",
        title: "Jaqueta Corta-Vento Active",
        price: 189.9,
        oldPrice: 239.9,
        rating: 4.6,
        isNew: false,
        image: CLOUD_PRODUCT,
      },
      {
        id: "p5",
        title: "Shorts Flex Training",
        price: 89.9,
        oldPrice: 119.9,
        rating: 4.5,
        isNew: false,
        image: CLOUD_PRODUCT,
      },
    ],
  },
  cta: {
    kicker: "ATENDIMENTO MARIMA",
    title: "suporte.marima.loja@gmail.com",
    description:
      "Seg a Sex, 9h - 18h (exceto feriados). Resposta por e-mail em até 24h úteis.",
    primary: "Falar com suporte",
    secondary: "Acompanhar pedido",
  },
  featuredPosts: {
    kicker: "CONTE?DOS MARIMA",
    title: "Guias e tendências fitness",
    description:
      "Dicas práticas para treino, estilo e cuidado das suas peças fitness.",
    posts: [
      {
        id: "b1",
        title: "Como escolher a legging ideal para cada tipo de treino",
        meta: "Guia ⬢ 5 min de leitura",
        image: CLOUD_BANNER,
      },
      {
        id: "b2",
        title: "Tecido tecnológico: o que faz diferença na performance",
        meta: "Performance ⬢ 6 min de leitura",
        image: CLOUD_BANNER,
      },
      {
        id: "b3",
        title: "Looks fitness e casual para manter conforto o dia inteiro",
        meta: "Estilo ⬢ 4 min de leitura",
        image: CLOUD_BANNER,
      },
    ],
  },
  newsletter: {
    kicker: "CADASTRE-SE PARA RECEBER NOVIDADES",
    title: "Fique por dentro das coleções Marima",
    description:
      "Receba lançamentos, ofertas e conteúdos exclusivos da Moda Fitness Marima.",
  },
  institutional: {
    title: "Nossa loja",
    location: "Marima ⬢ Volta Redonda - Rio de Janeiro",
    region: "Atendemos toda a Região Sul Fluminense.",
    serviceHours: "Seg a Sex, 9h - 18h (exceto feriados)",
    emailSla: "E-mail: até 24h úteis",
    email: "suporte.marima.loja@gmail.com",
    highlights: [
      "Troca e devolução em até 7 dias corridos após o recebimento (CDC).",
      "Dados tratados com sigilo e segurança conforme LGPD.",
      "Envio rápido para a Região Sul Fluminense: 2 a 7 dias úteis.",
    ],
  },
};
