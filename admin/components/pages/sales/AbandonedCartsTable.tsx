import { Badge } from "../../dashboard/ui";
import { formatBRL, formatDateShort } from "../../../lib/format";
import type { AbandonedCart } from "../../../lib/types";

export default function AbandonedCartsTable({
  carts,
  onRecover,
  onConvert,
  loadingActionId,
}: {
  carts: AbandonedCart[];
  onRecover?: (id: string) => void;
  onConvert?: (id: string) => void;
  loadingActionId?: string | null;
}) {
  const list = [...carts].sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1));

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
        Não há carrinhos abandonados no momento.
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr className="border-b border-slate-200/70">
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Itens</th>
            <th scope="col" className="px-4 py-3">Valor</th>
            <th scope="col" className="px-4 py-3">Última atividade</th>
            <th scope="col" className="px-4 py-3">Estágio</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {list.map((cart) => (
            <tr key={cart.id} className="transition-colors hover:bg-violet-50/35">
              <td data-label="Cliente" className="px-4 py-3 text-slate-700">
                <p className="font-semibold text-slate-900">{cart.customerName}</p>
                <p className="text-xs text-slate-500">{cart.email}</p>
              </td>
              <td data-label="Itens" className="px-4 py-3 text-slate-700">{cart.itemsCount}</td>
              <td data-label="Valor" className="px-4 py-3 text-slate-700">{formatBRL(cart.value)}</td>
              <td data-label="Última atividade" className="px-4 py-3 text-slate-500">{formatDateShort(cart.lastActivityAt)}</td>
              <td data-label="Estágio" className="px-4 py-3">
                <Badge tone={cart.stage === "quente" ? "danger" : cart.stage === "morno" ? "warn" : "neutral"}>
                  {cart.stage === "quente" ? "Quente" : cart.stage === "morno" ? "Morno" : "Frio"}
                </Badge>
              </td>
              <td data-label="Status" className="px-4 py-3">
                <Badge tone={cart.recovered ? "success" : "info"}>{cart.recovered ? "Recuperado" : "Em aberto"}</Badge>
              </td>
              <td data-label="Ações" className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onRecover?.(cart.id)}
                    disabled={loadingActionId === cart.id}
                    className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-violet-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-violet-50 disabled:opacity-60"
                  >
                    {loadingActionId === cart.id ? "Processando..." : "Recuperar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onConvert?.(cart.id)}
                    disabled={loadingActionId === cart.id}
                    className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Criar pedido
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
