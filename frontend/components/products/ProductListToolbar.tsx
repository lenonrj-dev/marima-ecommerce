import { Search } from "lucide-react";
import { fetchStoreCategories, formatCategoryLabel } from "@/lib/productsData";

function canonicalCategorySlug(value: string) {
  const raw = String(value || "").trim();
  const key = raw.toLocaleLowerCase("pt-BR");
  if (key === "acessorios" || key === "acessórios") return "casual";
  return raw;
}

type ProductListToolbarProps = {
  search?: string;
  category?: string;
  sort?: string;
};

export default async function ProductListToolbar({ search, category, sort }: ProductListToolbarProps) {
  const categories = await fetchStoreCategories();
  const activeCategory = category ? canonicalCategorySlug(category) : "";

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 border-b border-zinc-100 py-4">
          <form action="/produtos" className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[420px]">
              <input
                name="search"
                defaultValue={search}
                placeholder="Buscar leggings, tops, conjuntos..."
                aria-label="Buscar produtos"
                className="h-10 w-full rounded-full border border-zinc-200 bg-white pl-4 pr-10 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="products-category">
                Categoria
              </label>
              <select
                id="products-category"
                name="category"
                defaultValue={activeCategory}
                className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => {
                  const slug = canonicalCategorySlug(cat.slug);
                  return (
                    <option key={cat.id} value={slug}>
                    {(() => {
                      const label = formatCategoryLabel(slug);
                      return label === slug ? cat.name : label;
                    })()}
                  </option>
                  );
                })}
              </select>

              <label className="sr-only" htmlFor="products-sort">
                Ordenação
              </label>
              <select
                id="products-sort"
                name="sort"
                defaultValue={sort ?? "featured"}
                className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                <option value="featured">Destaques</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="rating_desc">Melhor avaliação</option>
                <option value="newest">Novidades</option>
              </select>

              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
