"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Badge, cn, Icon, Input } from "./ui";

type NavItem = {
  label: string;
  href: string;
  icon: Parameters<typeof Icon>[0]["name"];
  badge?: string;
};

type SidebarUser = {
  id: string;
  type: "admin";
  name: string;
  email: string;
  role: "admin" | "operacao" | "marketing" | "suporte";
  active: boolean;
};

const NAV: NavItem[] = [
  { label: "Início", href: "/", icon: "home" },
  { label: "Produtos", href: "/products", icon: "box" },
  { label: "Blog", href: "/blog", icon: "file" },
  { label: "Avaliacoes", href: "/reviews", icon: "life" },
  { label: "Vendas", href: "/sales", icon: "cart" },
  { label: "Marketing", href: "/marketing", icon: "tag" },
  { label: "Clientes", href: "/customers", icon: "users" },
  { label: "Estoque", href: "/inventory", icon: "layers" },
  { label: "Análises", href: "/analytics", icon: "chart" },
  { label: "Suporte", href: "/support", icon: "life", badge: "Novo" },
  { label: "Relatórios", href: "/reports", icon: "file" },
  { label: "Integrações", href: "/integrations", icon: "plug" },
  { label: "Configurações", href: "/settings", icon: "settings" },
];

function roleLabel(role: SidebarUser["role"]) {
  if (role === "admin") return "Administrador";
  if (role === "operacao") return "Operação";
  if (role === "marketing") return "Marketing";
  return "Suporte";
}

export default function Sidebar({
  onNavigate,
  user,
  onLogout,
}: {
  onNavigate?: () => void;
  user?: SidebarUser | null;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return NAV;
    return NAV.filter((item) => item.label.toLowerCase().includes(term));
  }, [query]);

  return (
    <aside className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7D48D3] text-white shadow-[0_12px_28px_rgba(125,72,211,0.34)]">
            <span className="text-base font-black">M</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">Marima Admin</p>
            <p className="truncate text-xs text-slate-500">CRM de e-commerce</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" />
            </span>
            <Input
              aria-label="Buscar no menu"
              placeholder="Buscar página"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="[&>input]:pl-10"
            />
          </div>
        </div>
      </div>

      <nav className="scroll-area flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1.5">
          {filtered.map((item) => {
            const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onNavigate?.()}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5",
                    "border border-transparent transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                    isActive
                      ? "border-violet-200/70 bg-violet-100/80 text-violet-800 shadow-[0_10px_30px_rgba(125,72,211,0.14)]"
                      : "text-slate-700 hover:border-slate-200/70 hover:bg-white/75"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-xl border transition",
                        isActive
                          ? "border-violet-200 bg-white text-violet-700"
                          : "border-slate-200 bg-white/70 text-slate-600"
                      )}
                    >
                      <Icon name={item.icon} />
                    </span>
                    <span className="truncate text-sm font-semibold">{item.label}</span>
                  </span>

                  {item.badge ? <Badge tone="info">{item.badge}</Badge> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200/70 px-4 py-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700"
              aria-hidden="true"
            >
              {(user?.name || "Admin")
                .split(" ")
                .slice(0, 2)
                .map((item) => item[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name || "Administrador"}</p>
              <p className="truncate text-xs text-slate-500">{user?.email || "admin@exemplo.com"}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge tone={user?.active ? "success" : "warn"}>{user?.active ? "Conectado" : "Inativo"}</Badge>
            <span className="text-[11px] font-medium text-slate-500">{user ? roleLabel(user.role) : "Demo"}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
