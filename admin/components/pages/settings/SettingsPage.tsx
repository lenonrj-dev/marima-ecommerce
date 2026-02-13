"use client";

import { Badge } from "../../dashboard/ui";
import StoreSettings from "./StoreSettings";
import TeamSettings from "./TeamSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Configurações</h1>
          <p className="mt-1 text-sm text-slate-500">Preferências da loja, equipe e segurança.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">Demonstração</Badge>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <StoreSettings />
        <TeamSettings />
      </section>

      <div className="rounded-2xl border border-slate-200/70 bg-[#F7F5FD] p-5">
        <p className="text-sm font-semibold text-slate-900">Checklist para backend (sugestão)</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Autenticação, RBAC e auditoria (logs por ação).</li>
          <li>Webhooks de pagamento/frete com sincronização incremental.</li>
          <li>Integração com eventos de funil (Pixel/GA) e atribuição.</li>
          <li>Exportações e rotinas (relatório semanal por e-mail).</li>
        </ul>
      </div>
    </div>
  );
}
