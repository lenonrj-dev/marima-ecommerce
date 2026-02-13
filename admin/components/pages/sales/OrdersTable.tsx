import { Badge } from "../../dashboard/ui";
import { formatBRL, formatDateShort } from "../../../lib/format";
import { orderStatusLabel, orderStatusTone } from "../../../lib/status";
import type { Order } from "../../../lib/types";

export default function OrdersTable({
  orders,
  onOpen,
}: {
  orders: Order[];
  onOpen: (order: Order) => void;
}) {
  const recent = [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  if (!recent.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
        Nenhum pedido disponível para este período.
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr className="border-b border-slate-200/70">
            <th scope="col" className="px-4 py-3">Pedido</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Itens</th>
            <th scope="col" className="px-4 py-3">Total</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Canal</th>
            <th scope="col" className="px-4 py-3">Data</th>
            <th scope="col" className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {recent.map((order) => (
            <tr key={order.id} className="transition-colors hover:bg-violet-50/35">
              <td data-label="Pedido" className="px-4 py-3 font-semibold text-slate-900">#{order.code}</td>
              <td data-label="Cliente" className="px-4 py-3 text-slate-700">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{order.customerName}</p>
                  <p className="truncate text-xs text-slate-500">{order.email}</p>
                </div>
              </td>
              <td data-label="Itens" className="px-4 py-3 text-slate-700">{order.itemsCount}</td>
              <td data-label="Total" className="px-4 py-3 text-slate-700">{formatBRL(order.total)}</td>
              <td data-label="Status" className="px-4 py-3">
                <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
              </td>
              <td data-label="Canal" className="px-4 py-3 text-slate-700">{order.channel}</td>
              <td data-label="Data" className="px-4 py-3 text-slate-500">{formatDateShort(order.createdAt)}</td>
              <td data-label="Ações" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpen(order)}
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-violet-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-violet-50"
                >
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


