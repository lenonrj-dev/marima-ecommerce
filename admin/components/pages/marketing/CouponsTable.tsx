import { Badge } from "../../dashboard/ui";
import { formatBRL, formatDateShort } from "../../../lib/format";
import type { Coupon } from "../../../lib/types";

function typeLabel(type: Coupon["type"]) {
  if (type === "percent") return "%";
  if (type === "fixed") return "R$";
  return "Frete";
}

export default function CouponsTable({
  coupons,
  onToggle,
}: {
  coupons: Coupon[];
  onToggle: (id: string) => void;
}) {
  const list = [...coupons].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-600">
        Nenhum cupom cadastrado até agora.
      </div>
    );
  }

  return (
    <div className="crm-table-wrap">
      <table className="crm-table text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr className="border-b border-slate-200/70">
            <th scope="col" className="px-4 py-3">Código</th>
            <th scope="col" className="px-4 py-3">Tipo</th>
            <th scope="col" className="px-4 py-3">Valor</th>
            <th scope="col" className="px-4 py-3">Mínimo</th>
            <th scope="col" className="px-4 py-3">Usos</th>
            <th scope="col" className="px-4 py-3">Período</th>
            <th scope="col" className="px-4 py-3">Ativo</th>
            <th scope="col" className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70">
          {list.map((coupon) => (
            <tr key={coupon.id} className="transition-colors hover:bg-violet-50/35">
              <td data-label="Código" className="px-4 py-3">
                <p className="font-semibold text-slate-900">{coupon.code}</p>
                <p className="text-xs text-slate-500">{coupon.description}</p>
              </td>
              <td data-label="Tipo" className="px-4 py-3 text-slate-700">{typeLabel(coupon.type)}</td>
              <td data-label="Valor" className="px-4 py-3 text-slate-700">
                {coupon.type === "percent" ? `${coupon.amount}%` : coupon.type === "fixed" ? formatBRL(coupon.amount) : "—"}
              </td>
              <td data-label="Mínimo" className="px-4 py-3 text-slate-700">{coupon.minSubtotal ? formatBRL(coupon.minSubtotal) : "—"}</td>
              <td data-label="Usos" className="px-4 py-3 text-slate-700">{coupon.uses}/{coupon.maxUses ?? "∞"}</td>
              <td data-label="Período" className="px-4 py-3 text-slate-500">
                {formatDateShort(coupon.startsAt)} — {formatDateShort(coupon.endsAt)}
              </td>
              <td data-label="Ativo" className="px-4 py-3">
                <Badge tone={coupon.active ? "success" : "neutral"}>{coupon.active ? "Sim" : "Não"}</Badge>
              </td>
              <td data-label="Ações" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onToggle(coupon.id)}
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
                >
                  {coupon.active ? "Pausar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
