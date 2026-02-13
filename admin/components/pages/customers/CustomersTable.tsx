import { Badge } from "../../dashboard/ui";
import { formatBRL, formatDateShort } from "../../../lib/format";
import type { Customer } from "../../../lib/types";

function segmentLabel(segment: Customer["segment"]) {
  if (segment === "vip") return "VIP";
  if (segment === "recorrente") return "Recorrente";
  if (segment === "novo") return "Novo";
  return "Inativo";
}

function segmentTone(segment: Customer["segment"]) {
  if (segment === "vip") return "success" as const;
  if (segment === "recorrente") return "info" as const;
  if (segment === "novo") return "warn" as const;
  return "neutral" as const;
}

export default function CustomersTable({
  customers,
  onOpen,
}: {
  customers: Customer[];
  onOpen: (customer: Customer) => void;
}) {
  const list = [...customers].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
        Nenhum cliente encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr className="border-b border-slate-200/70">
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Segmento</th>
            <th scope="col" className="px-4 py-3">Pedidos</th>
            <th scope="col" className="px-4 py-3">Total gasto</th>
            <th scope="col" className="px-4 py-3">Última compra</th>
            <th scope="col" className="px-4 py-3">Tags</th>
            <th scope="col" className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {list.map((customer) => (
            <tr key={customer.id} className="transition-colors hover:bg-violet-50/35">
              <td data-label="Cliente" className="px-4 py-3">
                <p className="font-semibold text-slate-900">{customer.name}</p>
                <p className="text-xs text-slate-500">{customer.email}</p>
              </td>
              <td data-label="Segmento" className="px-4 py-3">
                <Badge tone={segmentTone(customer.segment)}>{segmentLabel(customer.segment)}</Badge>
              </td>
              <td data-label="Pedidos" className="px-4 py-3 text-slate-700">{customer.ordersCount}</td>
              <td data-label="Total gasto" className="px-4 py-3 text-slate-700">{formatBRL(customer.totalSpent)}</td>
              <td data-label="Última compra" className="px-4 py-3 text-slate-500">
                {customer.lastOrderAt ? formatDateShort(customer.lastOrderAt) : "—"}
              </td>
              <td data-label="Tags" className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {customer.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                  {customer.tags.length > 3 ? <Badge tone="neutral">+{customer.tags.length - 3}</Badge> : null}
                </div>
              </td>
              <td data-label="Ações" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpen(customer)}
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-violet-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-violet-50"
                >
                  Ver detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
