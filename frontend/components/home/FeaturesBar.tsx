import Container from "@/components/ui/Container";
import { Headset, RefreshCcw, ShieldCheck, Truck } from "lucide-react";

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-zinc-900">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{desc}</p>
      </div>
    </div>
  );
}

export default function FeaturesBar() {
  return (
    <section className="bg-white pb-12">
      <Container>
        <div className="grid gap-6 rounded-2xl border border-zinc-100 bg-white px-6 py-6 shadow-soft md:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<Truck className="h-5 w-5" />}
            title="Envio rápido"
            desc="Região Sul Fluminense: 2 a 7 dias úteis"
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Compra segura"
            desc="Pagamento protegido e dados sob sigilo"
          />
          <Feature
            icon={<RefreshCcw className="h-5 w-5" />}
            title="Troca facilitada"
            desc="Até 7 dias corridos após o recebimento"
          />
          <Feature
            icon={<Headset className="h-5 w-5" />}
            title="Suporte ágil"
            desc="Atendimento de Seg a Sex, 9h - 18h"
          />
        </div>
      </Container>
    </section>
  );
}
