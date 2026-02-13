export type BlogTopic = {
  id: string;
  label: string;
};

export type BlogAuthor = {
  name: string;
  role: string;
  avatar: string;
  location: string;
};

export type BlogPostItem = {
  slug: string;
  title: string;
  excerpt: string;
  dateISO: string;
  topic: string;
  topic2?: string;
  author: string;
  cover: string;
  featured?: boolean;
};

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  dateISO: string;
  readingMinutes: number;
  topic: string;
  author: string;
  cover: string;
  content: Array<
    | { type: "h2"; text: string }
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "quote"; text: string }
  >;
  tags: string[];
};

export const BLOG_TOPICS: BlogTopic[] = [
  { id: "treino", label: "Treino" },
  { id: "moda-fitness", label: "Moda fitness" },
  { id: "tecnologia-textil", label: "Tecnologia têxtil" },
  { id: "bem-estar", label: "Bem-estar" },
  { id: "estilo-casual", label: "Estilo casual" },
  { id: "novidades", label: "Novidades" },
  { id: "guias", label: "Guias" },
  { id: "marima", label: "Marima" },
];

export const BLOG_AUTHOR: BlogAuthor = {
  name: "Time Marima",
  role: "Conteúdo e curadoria",
  avatar:
    "https://res.cloudinary.com/dxeooztro/image/upload/v1764855923/products/wm3vuf0hbfpmvf92ofma.png",
  location: "Volta Redonda, RJ",
};

export const BLOG_COVER =
  "https://res.cloudinary.com/dpyrbbvjd/image/upload/v1768760004/AthleisureBanner_dzhuwp.png";

export const BLOG_POSTS: BlogPostItem[] = [
  {
    slug: "legging-ideal-para-cada-treino",
    title: "Como escolher a legging ideal para cada tipo de treino",
    excerpt:
      "Entenda quais modelos oferecem mais compressão, conforto e respirabilidade para musculação, corrida e funcional.",
    dateISO: "2026-01-16",
    topic: "guias",
    topic2: "moda-fitness",
    author: "Time Marima",
    cover: BLOG_COVER,
    featured: true,
  },
  {
    slug: "top-alta-sustentacao-o-que-observar",
    title: "Top de alta sustentação: o que observar antes de comprar",
    excerpt:
      "Suporte, tecido tecnológico e ajuste correto fazem diferença no desempenho e no conforto do treino.",
    dateISO: "2026-01-12",
    topic: "treino",
    topic2: "tecnologia-textil",
    author: "Time Marima",
    cover: BLOG_COVER,
  },
  {
    slug: "tecido-tecnologico-e-performance-real",
    title: "Tecido tecnológico entrega performance de verdade?",
    excerpt:
      "Saiba como compressão, secagem rápida e respirabilidade impactam sua rotina fitness dentro e fora da academia.",
    dateISO: "2026-01-08",
    topic: "tecnologia-textil",
    topic2: "novidades",
    author: "Time Marima",
    cover: BLOG_COVER,
  },
  {
    slug: "look-fitness-para-dia-a-dia",
    title: "Look fitness para o dia a dia: conforto sem perder estilo",
    excerpt:
      "Veja como montar combinações versáteis de tops, jaquetas, leggings e peças casuais para uma rotina dinâmica.",
    dateISO: "2026-01-04",
    topic: "estilo-casual",
    author: "Time Marima",
    cover: BLOG_COVER,
  },
  {
    slug: "como-cuidar-das-pecas-fitness",
    title: "Como cuidar das peças fitness para aumentar a durabilidade",
    excerpt:
      "Boas práticas de lavagem e secagem para preservar a elasticidade, cor e ajuste das suas peças por mais tempo.",
    dateISO: "2025-12-28",
    topic: "guias",
    author: "Time Marima",
    cover: BLOG_COVER,
  },
  {
    slug: "frete-rastreio-e-transparencia-marima",
    title: "Frete, rastreio e transparência: como funciona na Marima",
    excerpt:
      "Do carrinho à entrega, explicamos os pontos de acompanhamento para você comprar com mais segurança.",
    dateISO: "2025-12-22",
    topic: "marima",
    topic2: "novidades",
    author: "Time Marima",
    cover: BLOG_COVER,
  },
  {
    slug: "rotina-fitness-com-mais-confianca",
    title: "Rotina fitness com mais confiança: peças certas para o seu objetivo",
    excerpt:
      "Escolher bem o caimento e o nível de compressão ajuda na mobilidade, no foco e na autoestima durante os treinos.",
    dateISO: "2025-12-18",
    topic: "bem-estar",
    author: "Time Marima",
    cover: BLOG_COVER,
  },
  {
    slug: "novidades-marima-janeiro",
    title: "Explorar novidades Marima: lançamentos do mês",
    excerpt:
      "Conheça os novos conjuntos, leggings e jaquetas da coleção com foco em conforto e performance.",
    dateISO: "2025-12-14",
    topic: "novidades",
    author: "Time Marima",
    cover: BLOG_COVER,
  },
];

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "legging-ideal-para-cada-treino",
    title: "Como escolher a legging ideal para cada tipo de treino",
    excerpt:
      "A legging certa melhora conforto, mobilidade e segurança no treino. O segredo está em tecido, compressão e ajuste.",
    dateISO: "2026-01-16",
    readingMinutes: 6,
    topic: "guias",
    author: "Time Marima",
    cover: BLOG_COVER,
    tags: ["legging", "compressão", "treino"],
    content: [
      {
        type: "p",
        text: "Na prática, não existe uma legging única para todos os treinos. Cada atividade pede níveis diferentes de sustentação e respirabilidade.",
      },
      { type: "h2", text: "O que avaliar antes da compra" },
      {
        type: "ul",
        items: [
          "Compressão adequada para reduzir transparência e aumentar firmeza",
          "Tecido tecnológico com secagem rápida",
          "Cós de alta sustentação para estabilidade",
        ],
      },
      {
        type: "p",
        text: "Para treino funcional e corrida, prefira modelos com compressão média a alta. Para treinos leves e uso casual, opte por tecidos mais macios e flexíveis.",
      },
      {
        type: "quote",
        text: "A peça ideal é aquela que acompanha seu ritmo, sem apertar demais e sem perder sustentação ao longo do dia.",
      },
      { type: "h2", text: "Como acertar no tamanho" },
      {
        type: "p",
        text: "Consulte a tabela de medidas e compare com uma peça que você já usa. O ajuste correto evita desconforto e melhora a performance.",
      },
    ],
  },
  {
    slug: "tecido-tecnologico-e-performance-real",
    title: "Tecido tecnológico entrega performance de verdade?",
    excerpt:
      "Mais do que tendência, tecidos certos reduzem desconfortos e melhoram o uso em treinos intensos e rotina corrida.",
    dateISO: "2026-01-08",
    readingMinutes: 7,
    topic: "tecnologia-textil",
    author: "Time Marima",
    cover: BLOG_COVER,
    tags: ["tecido tecnológico", "respirabilidade", "durabilidade"],
    content: [
      {
        type: "p",
        text: "Peças fitness de qualidade usam materiais pensados para respirabilidade, controle térmico e elasticidade com memória.",
      },
      { type: "h2", text: "Benefícios que você sente no uso" },
      {
        type: "ul",
        items: [
          "Menos sensação de umidade durante o treino",
          "Maior conforto em movimentos amplos",
          "Durabilidade superior mesmo com uso frequente",
        ],
      },
      {
        type: "p",
        text: "Quando a modelagem e o tecido trabalham juntos, o caimento permanece estável e a peça mantém aparência premium por mais tempo.",
      },
      { type: "h2", text: "Como escolher com segurança" },
      {
        type: "p",
        text: "Priorize marcas transparentes sobre composição, cuidados e política de troca. Isso reduz risco e melhora a experiência de compra.",
      },
    ],
  },
];

export function formatBlogDate(dateISO: string) {
  const date = new Date(dateISO + "T00:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getBlogArticle(slug: string) {
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (article) return article;

  const fallback = BLOG_POSTS.find((p) => p.slug === slug);
  if (!fallback) return BLOG_ARTICLES[0];

  return {
    slug: fallback.slug,
    title: fallback.title,
    excerpt: fallback.excerpt,
    dateISO: fallback.dateISO,
    readingMinutes: 5,
    topic: fallback.topic,
    author: fallback.author,
    cover: fallback.cover,
    tags: ["marima", "moda fitness", "novidades"],
    content: [
      { type: "p", text: fallback.excerpt },
      { type: "h2", text: "Resumo do conteúdo" },
      {
        type: "p",
        text: "Este artigo está em evolução e será atualizado com novos detalhes, exemplos e recomendações práticas.",
      },
      { type: "h2", text: "Próximos passos" },
      {
        type: "ul",
        items: ["Adicionar fotos reais das peças", "Incluir comparativos", "Publicar dicas extras de uso"],
      },
    ],
  } as BlogArticle;
}

export function getRelatedPosts(currentSlug: string) {
  return BLOG_POSTS.filter((p) => p.slug !== currentSlug).slice(0, 5);
}

export function topicLabel(topicId: string) {
  const t = BLOG_TOPICS.find((x) => x.id === topicId);
  return t?.label ?? "Categoria";
}
