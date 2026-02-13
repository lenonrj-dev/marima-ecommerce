import Link from "next/link";
import { fetchStoreCategories, formatCategoryLabel } from "@/lib/productsData";

function canonicalCategorySlug(value: string) {
  const raw = String(value || "").trim();
  const key = raw.toLocaleLowerCase("pt-BR");
  if (key === "acessorios" || key === "acessórios") return "casual";
  return raw;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-zinc-900">{children}</p>;
}

type FiltersSidebarProps = {
  category?: string;
};

const PRICE_FILTERS = [
  { label: "Até R$ 100", value: "100" },
  { label: "Até R$ 150", value: "150" },
  { label: "Até R$ 200", value: "200" },
  { label: "Até R$ 300", value: "300" },
] as const;

export default async function FiltersSidebar({ category }: FiltersSidebarProps) {
  const categories = await fetchStoreCategories();
  const activeCategory = category ? canonicalCategorySlug(category) : "";
  const total = categories.reduce((sum, item) => sum + (item.productCount ?? 0), 0);

  return (
    <aside className="hidden w-full max-w-[240px] shrink-0 lg:block">
      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <SectionTitle>Categorias</SectionTitle>
          <Link href="/produtos" className="text-[11px] font-medium text-zinc-500 hover:underline">
            Limpar
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href="/produtos"
            className={[
              "flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              !category ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50",
            ].join(" ")}
          >
            <span>Todas</span>
            <span className="text-xs text-zinc-400">{total}</span>
           </Link>
           {categories.map((item) => {
            const slug = canonicalCategorySlug(item.slug);
            const isActive = activeCategory === slug;
            const label = formatCategoryLabel(slug);
            const displayName = label === slug ? item.name : label;
            return (
              <Link
                key={item.id}
                href={`/produtos?category=${encodeURIComponent(slug)}`}
                className={[
                  "flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
                  isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50",
                ].join(" ")}
              >
                <span>{displayName}</span>
                <span className="text-xs text-zinc-400">{item.productCount ?? 0}</span>
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
              href={`/produtos?maxPrice=${item.value}`}
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
