import type { Metadata } from "next";
import Link from "next/link";
import HelpHero from "@/components/help/HelpHero";

const helpIndex = [
  {
    href: "/central-de-ajuda/entrega",
    title: "Entrega",
    description: "Política de Entrega",
  },
  {
    href: "/central-de-ajuda/privacidade",
    title: "Privacidade",
    description: "Política de Privacidade (LGPD)",
  },
  {
    href: "/central-de-ajuda/trocas-e-devolucoes",
    title: "Troca e devolução",
    description: "Regras e prazos (CDC)",
  },
  {
    href: "/central-de-ajuda/como-comprar",
    title: "Como comprar",
    description: "Passo a passo da compra",
  },
  {
    href: "/central-de-ajuda/procon-rj",
    title: "Atendimento",
    description: "Canais oficiais e transparência",
  },
];

export const metadata: Metadata = {
  title: "Central de Ajuda Marima: políticas, entregas, trocas e privacidade",
  description:
    "Políticas e orientações da Marima: entrega, privacidade (LGPD), troca e devolução, atendimento e como comprar.",
};

export default function HelpCenterIndexPage() {
  return (
    <main className="min-h-[60vh] bg-white">
      <HelpHero />

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-soft">
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Escolha um tópico</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Acesse as seções abaixo para ver políticas, orientações e canais de atendimento da
                Marima.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {helpIndex.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                  >
                    {item.title} &rarr;
                    <p className="mt-1 text-sm font-normal text-zinc-600">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

