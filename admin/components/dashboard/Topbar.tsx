"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Badge, Button, Icon, cn } from "./ui";

type QuickAction = {
  id: string;
  label: string;
  variant: "primary" | "secondary" | "ghost";
  href?: string;
  onClick?: () => void;
};

const ROUTE_TITLE: Array<{ match: RegExp; title: string; subtitle: string }> = [
  { match: /^\/$/, title: "Início", subtitle: "Resumo operacional da loja" },
  { match: /^\/products/, title: "Produtos", subtitle: "Catálogo e cadastros" },
  { match: /^\/sales/, title: "Vendas", subtitle: "Pedidos e recuperação" },
  { match: /^\/marketing/, title: "Marketing", subtitle: "Campanhas e incentivos" },
  { match: /^\/customers/, title: "Clientes", subtitle: "Relacionamento e segmentação" },
  { match: /^\/inventory/, title: "Estoque", subtitle: "Inventário e reposição" },
  { match: /^\/analytics/, title: "Análises", subtitle: "Indicadores de performance" },
  { match: /^\/support/, title: "Suporte", subtitle: "Atendimento e pós-venda" },
  { match: /^\/reports/, title: "Relatórios", subtitle: "Exportações e gestão" },
  { match: /^\/integrations/, title: "Integrações", subtitle: "Conectores e webhooks" },
  { match: /^\/settings/, title: "Configurações", subtitle: "Preferências e equipe" },
];

function resolveTitle(pathname: string) {
  const found = ROUTE_TITLE.find((route) => route.match.test(pathname));
  return found ?? ROUTE_TITLE[0];
}

function resolveActions(pathname: string): QuickAction[] {
  const base: QuickAction[] = [
    {
      id: "sync",
      label: "Sincronizar",
      variant: "secondary",
      onClick: () => alert("Ação (demo): sincronizar dados com backend."),
    },
    {
      id: "export",
      label: "Exportar",
      variant: "ghost",
      onClick: () => alert("Exportação (demo): gerar relatório geral."),
    },
  ];

  if (pathname.startsWith("/products")) {
    return [{ id: "new-product", label: "Novo produto", variant: "primary", href: "/products" }, ...base];
  }

  if (pathname.startsWith("/marketing")) {
    return [{ id: "new-campaign", label: "Nova campanha", variant: "primary", href: "/marketing" }, ...base];
  }

  if (pathname.startsWith("/sales")) {
    return [{ id: "new-order", label: "Novo pedido", variant: "primary", href: "/sales" }, ...base];
  }

  if (pathname.startsWith("/customers")) {
    return [{ id: "new-customer", label: "Novo cliente", variant: "primary", href: "/customers" }, ...base];
  }

  return [{ id: "new-product", label: "Novo produto", variant: "primary", href: "/products" }, ...base];
}

export default function Topbar({
  scrolled = false,
  onOpenSidebar,
}: {
  scrolled?: boolean;
  onOpenSidebar?: () => void;
}) {
  const pathname = usePathname();

  const current = useMemo(() => resolveTitle(pathname), [pathname]);
  const actions = useMemo(() => resolveActions(pathname), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/85 backdrop-blur-md transition-all duration-200",
        scrolled
          ? "border-slate-200/95 shadow-[0_8px_26px_rgba(15,23,42,0.10)]"
          : "border-transparent shadow-none"
      )}
    >
      <div className="px-4 py-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onOpenSidebar}
                className={cn(
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700",
                  "shadow-[0_4px_14px_rgba(15,23,42,0.06)]",
                  "hover:bg-slate-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                  "lg:hidden"
                )}
                aria-label="Abrir menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">{current.title}</p>
                <p className="truncate text-xs text-slate-500">{current.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone="neutral">Demo</Badge>
              <span className="hidden text-xs text-slate-500 sm:inline">Última sincronização: agora mesmo</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-2xl">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" />
              </span>
              <input
                aria-label="Busca global"
                placeholder="Buscar pedidos, produtos, clientes e tickets..."
                className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-[0_4px_16px_rgba(15,23,42,0.05)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  href={action.href}
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
