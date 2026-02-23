import { buildApiUrl } from "@/lib/api";

export type BlogTopic = {
  id: string;
  label: string;
};

export type BlogCategoryCountMap = Record<string, number>;

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

export type ApiPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  topic?: string;
  topic2?: string;
  featured?: boolean;
  readingMinutes?: number;
  published?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
};

export type BlogListMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type BlogListingResult = {
  posts: BlogPostItem[];
  meta: BlogListMeta;
};

type BlogPostListOptions = {
  page?: number;
  limit?: number;
  q?: string;
  topic?: string;
  tags?: string[];
  sort?: "relevance" | "newest";
  status?: "published" | "draft" | "all";
};

export const BLOG_TOPICS: BlogTopic[] = [
  { id: "treino", label: "Treino" },
  { id: "moda-fitness", label: "Moda fitness" },
  { id: "tecnologia-textil", label: "Tecnologia textil" },
  { id: "bem-estar", label: "Bem-estar" },
  { id: "estilo-casual", label: "Estilo casual" },
  { id: "novidades", label: "Novidades" },
  { id: "guias", label: "Guias" },
  { id: "marima", label: "Marima" },
];

export const BLOG_AUTHOR: BlogAuthor = {
  name: "Time Marima",
  role: "Conteudo e curadoria",
  avatar:
    "https://res.cloudinary.com/dxeooztro/image/upload/v1764855923/products/wm3vuf0hbfpmvf92ofma.png",
  location: "Volta Redonda, RJ",
};

export const BLOG_COVER =
  "https://res.cloudinary.com/dpyrbbvjd/image/upload/v1768760004/AthleisureBanner_dzhuwp.png";

export const BLOG_ARTICLES: BlogArticle[] = [];
export const BLOG_POSTS: BlogPostItem[] = [];

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

const TOPIC_IDS = new Set(BLOG_TOPICS.map((topic) => topic.id));
const TOPIC_LOOKUP = new Map<string, string>();

for (const topic of BLOG_TOPICS) {
  TOPIC_LOOKUP.set(normalizeKey(topic.id), topic.id);
  TOPIC_LOOKUP.set(normalizeKey(topic.label), topic.id);
}

function normalizeTopic(topic: unknown, tags: string[] = []) {
  if (typeof topic === "string" && TOPIC_IDS.has(topic)) {
    return topic;
  }

  if (typeof topic === "string") {
    const byTopicText = TOPIC_LOOKUP.get(normalizeKey(topic));
    if (byTopicText) return byTopicText;
  }

  for (const tag of tags) {
    const byTagText = TOPIC_LOOKUP.get(normalizeKey(tag));
    if (byTagText) return byTagText;
  }

  return "novidades";
}

function toDateISO(rawDate: unknown) {
  if (typeof rawDate !== "string" || !rawDate.trim()) return "";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function sanitizeTags(tags: unknown) {
  if (!Array.isArray(tags)) return [] as string[];
  return tags.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function estimateReadingMinutes(content: string, explicit?: number) {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return Math.floor(explicit);
  }
  const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function parseContentBlocks(rawContent: string) {
  const content = String(rawContent || "").replace(/\r/g, "").trim();
  if (!content) {
    return [{ type: "p", text: "Conteudo indisponivel." }] as BlogArticle["content"];
  }

  const blocks: BlogArticle["content"] = [];
  const lines = content.split("\n");
  const listBuffer: string[] = [];

  function flushListBuffer() {
    if (!listBuffer.length) return;
    blocks.push({ type: "ul", items: [...listBuffer] });
    listBuffer.length = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushListBuffer();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushListBuffer();
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      listBuffer.push(trimmed.slice(2).trim());
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushListBuffer();
      blocks.push({ type: "quote", text: trimmed.slice(2).trim() });
      continue;
    }

    flushListBuffer();
    blocks.push({ type: "p", text: trimmed });
  }

  flushListBuffer();

  if (!blocks.length) {
    return [{ type: "p", text: "Conteudo indisponivel." }] as BlogArticle["content"];
  }

  return blocks;
}

export function mapApiPostToBlogPostItem(post: ApiPost): BlogPostItem {
  const tags = sanitizeTags(post.tags);
  const primaryTopic = normalizeTopic(post.topic, tags);
  const secondaryTopic = post.topic2 ? normalizeTopic(post.topic2, tags) : undefined;

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || "",
    dateISO: toDateISO(post.publishedAt || post.createdAt),
    topic: primaryTopic,
    topic2: secondaryTopic && secondaryTopic !== primaryTopic ? secondaryTopic : undefined,
    author: post.authorName || "Time Marima",
    cover: post.coverImage || BLOG_COVER,
    featured: Boolean(post.featured),
  };
}

function toBlogArticle(post: ApiPost): BlogArticle {
  const tags = sanitizeTags(post.tags);
  const topic = normalizeTopic(post.topic, tags);
  const content = String(post.content || post.excerpt || "").trim();

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || "",
    dateISO: toDateISO(post.publishedAt || post.createdAt),
    readingMinutes: estimateReadingMinutes(content, post.readingMinutes),
    topic,
    author: post.authorName || "Time Marima",
    cover: post.coverImage || BLOG_COVER,
    tags,
    content: parseContentBlocks(content),
  };
}

async function requestBlogApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(buildApiUrl(path), { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchBlogPostsForListing(options?: BlogPostListOptions) {
  const result = await fetchBlogPostsListing(options);
  return result.posts;
}

export async function fetchBlogPostsListing(options?: BlogPostListOptions): Promise<BlogListingResult> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 48;
  const params = new URLSearchParams();
  params.set("status", options?.status || "published");
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (options?.q?.trim()) params.set("q", options.q.trim());
  if (options?.topic?.trim()) params.set("topic", options.topic.trim());
  if (options?.sort) params.set("sort", options.sort);
  if (options?.tags?.length) {
    const tags = options.tags
      .map((tag) => String(tag || "").trim())
      .filter(Boolean)
      .join(",");
    if (tags) params.set("tags", tags);
  }

  const response = await requestBlogApi<{
    data: ApiPost[];
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
      pages?: number;
    };
  }>(`/api/v1/blog/posts?${params.toString()}`);

  const posts = Array.isArray(response?.data) ? response.data.map(mapApiPostToBlogPostItem) : [];
  const safePage = toSafePositiveInt(response?.meta?.page, page);
  const safeLimit = toSafePositiveInt(response?.meta?.limit, limit);
  const safeTotal = toSafeCount(response?.meta?.total ?? posts.length);
  const safePages = toSafePositiveInt(response?.meta?.pages, Math.max(1, Math.ceil(safeTotal / safeLimit)));

  return {
    posts,
    meta: {
      total: safeTotal,
      page: safePage,
      limit: safeLimit,
      pages: safePages,
    },
  };
}

export async function fetchBlogArticleBySlug(slug: string) {
  const response = await requestBlogApi<{ data: ApiPost }>(`/api/v1/blog/posts/${encodeURIComponent(slug)}`);
  if (!response?.data) return null;
  return toBlogArticle(response.data);
}

export async function fetchRelatedBlogPosts(currentSlug: string, limit = 5) {
  const response = await requestBlogApi<{ data: ApiPost[] }>(
    `/api/v1/blog/posts?status=published&page=1&limit=20`,
  );

  if (!response?.data?.length) {
    return [] as BlogPostItem[];
  }

  return response.data.map(mapApiPostToBlogPostItem).filter((post) => post.slug !== currentSlug).slice(0, limit);
}

export function getBlogArticle(_slug: string) {
  return null;
}

export function getRelatedPosts(_currentSlug: string) {
  return [] as BlogPostItem[];
}

export function formatBlogDate(dateISO: string) {
  if (!dateISO) return "";
  const date = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateISO;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function topicLabel(topicId: string) {
  const topic = BLOG_TOPICS.find((item) => item.id === topicId);
  return topic?.label ?? "Categoria";
}

function createEmptyTopicCountMap(): BlogCategoryCountMap {
  return BLOG_TOPICS.reduce((acc, topic) => {
    acc[topic.id] = 0;
    return acc;
  }, {} as BlogCategoryCountMap);
}

function toSafeCount(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.floor(numeric));
}

function toSafePositiveInt(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.floor(numeric));
}

function normalizeTopicId(value: unknown) {
  if (typeof value !== "string") return "novidades";
  const normalized = TOPIC_LOOKUP.get(normalizeKey(value));
  return normalized || "novidades";
}

export async function fetchBlogCategoryCounts() {
  const emptyCounts = createEmptyTopicCountMap();

  try {
    const response = await requestBlogApi<{
      data?: {
        counts?: Array<{ slug?: string; category?: string; count?: number }>;
      };
      counts?: Array<{ slug?: string; category?: string; count?: number }>;
    }>("/api/v1/blog/categories/counts");

    const responseCounts = Array.isArray(response?.data?.counts)
      ? response?.data?.counts
      : Array.isArray(response?.counts)
        ? response?.counts
        : [];

    for (const item of responseCounts) {
      const topicId = normalizeTopicId(item?.slug || item?.category);
      emptyCounts[topicId] = emptyCounts[topicId] + toSafeCount(item?.count);
    }
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[blog] Falha ao carregar contagem por categoria.");
    }
  }

  return emptyCounts;
}
