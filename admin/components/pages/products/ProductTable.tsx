import { Badge, cn } from "../../dashboard/ui";
import { formatBRL, formatCategoryLabel, formatDateShort } from "../../../lib/format";
import { productStatusLabel, productStatusTone } from "../../../lib/status";
import type { Product } from "../../../lib/types";

export default function ProductTable({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (product: Product) => void;
}) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
        Nenhum produto encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr className="border-b border-slate-200/70">
            <th scope="col" className="px-4 py-3">Produto</th>
            <th scope="col" className="px-4 py-3">Categoria</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Estoque</th>
            <th scope="col" className="px-4 py-3">Preço</th>
            <th scope="col" className="px-4 py-3">Ativo</th>
            <th scope="col" className="px-4 py-3">Atualizado</th>
            <th scope="col" className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {products.map((product) => (
            <tr
              key={product.id}
              className={cn("transition-colors hover:bg-violet-50/35", "focus-within:bg-violet-50/45")}
            >
              <td data-label="Produto" className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200/70">
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{product.name}</p>
                    <p className="truncate text-xs text-slate-500">{product.shortDescription}</p>
                    {product.groupKey || product.colorName ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {product.colorName ? (
                          <Badge tone="info" className="gap-1.5">
                            <span
                              aria-hidden="true"
                              className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/10"
                              style={{ backgroundColor: product.colorHex || "#8B5CF6" }}
                            />
                            {product.colorName}
                          </Badge>
                        ) : null}
                        {product.groupKey ? (
                          <span title={`groupKey: ${product.groupKey}`} className="max-w-full">
                            <Badge tone="neutral" className="max-w-[240px] truncate">
                              {product.groupKey}
                            </Badge>
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td data-label="Categoria" className="px-4 py-3 text-slate-700">{formatCategoryLabel(product.category)}</td>
              <td data-label="Status" className="px-4 py-3">
                <Badge tone={productStatusTone(product.status)}>{productStatusLabel(product.status)}</Badge>
              </td>
              <td data-label="Estoque" className="px-4 py-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">{product.stock} un.</p>
                  {Array.isArray(product.sizes) && product.sizes.length ? (
                    <p className="text-xs text-slate-500">
                      {(() => {
                        const rows = product.sizes.filter((row) => row.active !== false);
                        const head = rows.slice(0, 4).map((row) => `${row.label}:${row.stock}`).join(" ");
                        const more = rows.length > 4 ? ` +${rows.length - 4}` : "";
                        return `${head}${more}`.trim();
                      })()}
                    </p>
                  ) : null}
                </div>
              </td>
              <td data-label="Preço" className="px-4 py-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900">{formatBRL(product.price)}</p>
                  {product.compareAtPrice ? (
                    <p className="text-xs text-slate-400 line-through">{formatBRL(product.compareAtPrice)}</p>
                  ) : null}
                </div>
              </td>
              <td data-label="Ativo" className="px-4 py-3">
                <Badge tone={product.active ? "success" : "neutral"}>{product.active ? "Sim" : "Não"}</Badge>
              </td>
              <td data-label="Atualizado" className="px-4 py-3 text-slate-500">{formatDateShort(product.updatedAt)}</td>
              <td data-label="Ações" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpen(product)}
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-violet-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-violet-50"
                >
                  Ver produto
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

