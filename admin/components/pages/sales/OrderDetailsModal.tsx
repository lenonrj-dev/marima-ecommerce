"use client";

import { useState } from "react";
import Modal from "../../dashboard/Modal";
import { Badge, Button, Card, CardBody, Divider, Select } from "../../dashboard/ui";
import { formatBRL, formatDateShort } from "../../../lib/format";
import { orderStatusLabel, orderStatusTone } from "../../../lib/status";
import type { Order } from "../../../lib/types";

const ORDER_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "separacao", label: "Em separação" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
  { value: "reembolsado", label: "Reembolsado" },
] as const;

export default function OrderDetailsModal({
  open,
  onClose,
  order,
  onUpdateStatus,
  updating,
}: {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus?: (id: string, status: Order["status"]) => Promise<void> | void;
  updating?: boolean;
}) {
  const [status, setStatus] = useState<Order["status"]>(() => order?.status ?? "pendente");

  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pedido #${order.code}`}
      description={`${order.customerName} • ${order.email}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button variant="secondary" onClick={() => alert("Ação: gerar etiqueta de envio")}>Gerar etiqueta</Button>
          <Button
            variant="primary"
            disabled={updating || status === order.status}
            onClick={() => onUpdateStatus?.(order.id, status)}
          >
            {updating ? "Salvando..." : "Atualizar status"}
          </Button>
        </>
      }
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formatBRL(order.total)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Status</p>
              <div className="mt-2">
                <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Data</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateShort(order.createdAt)}</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entrega e pagamento</p>
            <p className="text-sm text-slate-700">Método: <span className="font-semibold text-slate-900">{order.shippingMethod}</span></p>
            <p className="text-sm text-slate-700">Pagamento: <span className="font-semibold text-slate-900">{order.paymentMethod}</span></p>
            <p className="text-sm text-slate-700">Canal: <span className="font-semibold text-slate-900">{order.channel}</span></p>

            <Select
              label="Atualizar status"
              value={status}
              onChange={(event) => setStatus(event.target.value as Order["status"])}
              options={[...ORDER_STATUS_OPTIONS]}
            />
          </CardBody>
        </Card>

        <Divider />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Itens do pedido</p>
          <div className="mt-2 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">Qtd: {item.qty} • SKU: {item.sku || "—"}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatBRL(item.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

