"use client";

import { useMemo, useState } from "react";
import Modal from "../../dashboard/Modal";
import { Button, Input, Select, Toggle } from "../../dashboard/ui";
import type { Coupon } from "../../../lib/types";

const TYPES = [
  { value: "percent", label: "Percentual (%)" },
  { value: "fixed", label: "Valor fixo (R$)" },
  { value: "shipping", label: "Frete grátis" },
];

export default function CouponModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (coupon: Coupon) => Promise<void> | void;
}) {
  const [code, setCode] = useState("BEMVINDO10");
  const [description, setDescription] = useState("10% OFF na primeira compra");
  const [type, setType] = useState<Coupon["type"]>("percent");
  const [amount, setAmount] = useState(10);
  const [minSubtotal, setMinSubtotal] = useState(0);
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const now = useMemo(() => new Date(), []);
  const ends = useMemo(() => {
    const date = new Date(now);
    date.setDate(date.getDate() + 30);
    return date;
  }, [now]);

  async function submit() {
    setSubmitting(true);

    try {
      const id = `cp_${Math.random().toString(16).slice(2)}`;

      await onCreate({
        id,
        code: code.trim().toUpperCase(),
        description: description.trim(),
        type,
        amount: type === "shipping" ? 0 : Number(amount || 0),
        minSubtotal: Number(minSubtotal || 0) || undefined,
        uses: 0,
        maxUses: maxUses === "" ? undefined : Number(maxUses || 0),
        startsAt: now.toISOString(),
        endsAt: ends.toISOString(),
        active,
        createdAt: now.toISOString(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo cupom"
      description="Crie cupons promocionais e conecte ao checkout em tempo real."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? "Salvando..." : "Criar cupom"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Input label="Código" value={code} onChange={(event) => setCode(event.target.value)} />
        <Select
          label="Tipo"
          value={type}
          onChange={(event) => setType(event.target.value as Coupon["type"])}
          options={TYPES}
        />

        <Input
          label={type === "percent" ? "Percentual" : "Valor"}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={String(amount)}
          onChange={(event) => setAmount(Number(event.target.value || 0))}
          disabled={type === "shipping"}
        />

        <Input
          label="Subtotal mínimo"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={String(minSubtotal)}
          onChange={(event) => setMinSubtotal(Number(event.target.value || 0))}
        />

        <Input
          label="Limite de usos (opcional)"
          type="number"
          inputMode="numeric"
          min={0}
          value={maxUses === "" ? "" : String(maxUses)}
          onChange={(event) => setMaxUses(event.target.value === "" ? "" : Number(event.target.value))}
        />

        <Input
          label="Descrição"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="lg:col-span-2"
        />

        <div className="lg:col-span-2">
          <Toggle checked={active} onChange={setActive} label="Cupom ativo" />
        </div>

        <p className="lg:col-span-2 text-xs text-slate-500">
          Datas padrão: hoje até 30 dias. Você pode ajustar depois na listagem de cupons.
        </p>
      </div>
    </Modal>
  );
}
