import Link from "next/link";
import { type CategoryFacet, normalizeCategoryKey } from "@/lib/productsData";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-zinc-900">{children}</p>;
}

type FiltersSidebarProps = {
  category?: string;
  categories: CategoryFacet[];
  search?: string;
  sort?: string;
  maxPrice?: number;
  totalCount?: number;
};

const PRICE_FILTERS = [
  { label: "Até R$ 100", value: "100" },
  { label: "Até R$ 150", value: "150" },
  { label: "Até R$ 200", value: "200" },
  { label: "Até R$ 300", value: "300" },
] as const;

function buildProdutosHref(input: {
  category?: string;
  search?: string;
  sort?: string;
  maxPrice?: number;
}) {
  const query = new URLSearchParams();
  if (input.search) query.set("search", input.search);
  if (input.sort) query.set("sort", input.sort);
  if (typeof input.maxPrice === "number" && Number.isFinite(input.maxPrice)) {
    query.set("maxPrice", String(input.maxPrice));
  }
  if (input.category) query.set("category", input.category);

  const qs = query.toString();
  return qs ? `/produtos?${qs}` : "/produtos";
}

export default function FiltersSidebar({
  category,
  categories,
  search,
  sort,
  maxPrice,
  totalCount,
}: FiltersSidebarProps) {
  const activeCategory = normalizeCategoryKey(category || "");
  const total =
    typeof totalCount === "number" && Number.isFinite(totalCount)
      ? Math.max(0, Math.floor(totalCount))
      : categories.reduce((sum, item) => sum + Math.max(0, Math.floor(item.count || 0)), 0);

  return (
    <aside className="hidden w-full max-w-[240px] shrink-0 lg:block">
      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <SectionTitle>Categorias</SectionTitle>
          <Link
            href={buildProdutosHref({ search, sort, maxPrice })}
            className="text-[11px] font-medium text-zinc-500 hover:underline"
          >
            Limpar
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href={buildProdutosHref({ search, sort, maxPrice })}
            className={[
              "flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              !activeCategory ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50",
            ].join(" ")}
          >
            <span>Todas</span>
            <span className="text-xs text-zinc-400">{total}</span>
          </Link>
          {categories.map((item) => {
            const slug = normalizeCategoryKey(item.slug || item.key);
            if (!slug) return null;

            const isActive = activeCategory === slug;
            return (
              <Link
                key={item.key}
                href={buildProdutosHref({ category: slug, search, sort, maxPrice })}
                className={[
                  "flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50",
                ].join(" ")}
              >
                <span>{item.label}</span>
                <span className="text-xs text-zinc-400">{item.count}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-5 h-px w-full bg-zinc-100" />

        <div className="flex items-center justify-between">
          <SectionTitle>Faixa de preço</SectionTitle>
        </div>

        <div className="mt-4 space-y-2">
          {PRICE_FILTERS.map((item) => (
            <Link
              key={item.value}
              href={buildProdutosHref({
                category: activeCategory || undefined,
                search,
                sort,
                maxPrice: Number(item.value),
              })}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
