"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User2, Heart, MapPin, Package2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV } from "@/lib/dashboardData";

type DashboardSidebarProps = {
  onNavigate?: () => void;
  user?: {
    name?: string;
    email?: string;
  } | null;
  onLogout?: () => void;
};

function iconFor(key: (typeof DASHBOARD_NAV)[number]["key"]) {
  switch (key) {
    case "overview":
      return <LayoutDashboard className="h-4 w-4" />;
    case "profile":
      return <User2 className="h-4 w-4" />;
    case "favorites":
      return <Heart className="h-4 w-4" />;
    case "address":
      return <MapPin className="h-4 w-4" />;
    case "orders":
      return <Package2 className="h-4 w-4" />;
  }
}

export default function DashboardSidebar({ onNavigate, user, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname();
  const items = useMemo(() => DASHBOARD_NAV, []);

  const userName = user?.name || "Cliente Marima";
  const userEmail = user?.email || "cliente@marima.com";

  return (
    <aside className="w-full">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-white">
            {userName
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{userName}</p>
            <p className="truncate text-xs text-zinc-600">{userEmail}</p>
          </div>
        </div>

        <nav className="mt-4 grid gap-1">
          {items.map((it) => {
            const active =
              it.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(it.href);

            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
                  active ? "bg-zinc-900 text-white" : "bg-white text-zinc-800 hover:bg-zinc-50",
                )}
              >
                <span className="inline-flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl border",
                      active ? "border-white/15 bg-white/10" : "border-zinc-200 bg-white",
                    )}
                    aria-hidden
                  >
                    {iconFor(it.key)}
                  </span>
                  {it.label}
                </span>
                <span className={cn("text-xs", active ? "text-white/70" : "text-zinc-500")}>-&gt;</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Sair"
          >
            <span className="inline-flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white" aria-hidden>
                <LogOut className="h-4 w-4" />
              </span>
              Sair
            </span>
            <span className="text-xs text-zinc-500">-&gt;</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
