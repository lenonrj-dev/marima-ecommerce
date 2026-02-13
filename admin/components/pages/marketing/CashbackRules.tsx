"use client";

import { Badge, Button, Card, CardBody, CardHeader } from "../../dashboard/ui";
import { formatBRL } from "../../../lib/format";
import type { CashbackRule } from "../../../lib/types";

export default function CashbackRules({
  rules,
  onToggle,
}: {
  rules: CashbackRule[];
  onToggle: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader title="Cashback" subtitle="Regras e limites (demo)" right={<Badge tone="info">Beta</Badge>} />
      <CardBody className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{rule.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {rule.percent}% • validade {rule.validDays} dias • mínimo {formatBRL(rule.minSubtotal)} • teto {formatBRL(rule.maxCashback)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={rule.active ? "success" : "neutral"}>{rule.active ? "Ativa" : "Pausada"}</Badge>
              <Button variant="secondary" size="sm" onClick={() => onToggle(rule.id)}>
                {rule.active ? "Pausar" : "Ativar"}
              </Button>
            </div>
          </div>
        ))}

        <p className="text-xs text-slate-500">Backend: calcule cashback por item/pedido, respeitando regras, saldos e expiração.</p>
      </CardBody>
    </Card>
  );
}
