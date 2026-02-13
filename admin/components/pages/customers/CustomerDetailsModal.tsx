"use client";

import Modal from "../../dashboard/Modal";
import { Badge, Button, Card, CardBody, Divider } from "../../dashboard/ui";
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

export default function CustomerDetailsModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}) {
  if (!customer) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer.name}
      description={customer.email}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button variant="secondary" onClick={() => alert("Ação (demo): criar campanha para este segmento.")}>Criar campanha</Button>
          <Button variant="primary" onClick={() => alert("Ação (demo): salvar alterações via API.")}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={segmentTone(customer.segment)}>{segmentLabel(customer.segment)}</Badge>
          <Badge tone="neutral">Pedidos: {customer.ordersCount}</Badge>
          <Badge tone="neutral">Total: {formatBRL(customer.totalSpent)}</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Cadastro</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateShort(customer.createdAt)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Última compra</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{customer.lastOrderAt ? formatDateShort(customer.lastOrderAt) : "—"}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Contato</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{customer.phone || "—"}</p>
            </CardBody>
          </Card>
        </div>

        <Divider />

        <div>
          <p className="text-sm font-semibold text-slate-900">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {customer.tags.length ? (
              customer.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-slate-500">Sem tags.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4">
          <p className="text-sm font-semibold text-slate-900">Próximos passos</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Disparar cupom de recompra (recorrente) ou reativação (inativo).</li>
            <li>Usar cashback para aumentar LTV e reduzir churn.</li>
            <li>Automatizar pós-compra (upsell/cross-sell) por e-mail e WhatsApp.</li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">Backend: aqui você puxa histórico de pedidos, endereços, eventos do funil e atendimento.</p>
      </div>
    </Modal>
  );
}
