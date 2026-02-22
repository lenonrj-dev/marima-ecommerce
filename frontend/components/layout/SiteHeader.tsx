"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Container from "@/components/ui/Container";
import TopBar from "@/components/layout/TopBar";
import IconButton from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { Heart, Menu, Search, User, X } from "lucide-react";
import CartTrigger from "@/components/cart/CartTrigger";
import { MAIN_NAV, SITE_COPY } from "@/lib/siteCopy";
import { apiFetch } from "@/lib/api";

type AuthMeResponse = {
  data?: {
    name?: string | null;
    customer?: { name?: string | null } | null;
  } | null;
  user?: { name?: string | null } | null;
  customer?: { name?: string | null } | null;
  name?: string | null;
};

function resolveUserName(payload: AuthMeResponse) {
  const rawName =
    payload?.data?.name ??
    payload?.user?.name ??
    payload?.name ??
    payload?.data?.customer?.name ??
    payload?.customer?.name ??
    null;

  return typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [accountOpen, setAccountOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountPanelRef = useRef<HTMLDivElement | null>(null);

  const nav = useMemo(() => MAIN_NAV, []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim();
    const url = term ? `/produtos?search=${encodeURIComponent(term)}` : "/produtos";
    router.push(url);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  const logoSrc =
    "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771339219/MARIMA._1_hrjb8k.png";

  const logo = (
    <span className="relative inline-flex items-center">
      <Image
        src={logoSrc}
        alt={SITE_COPY.brand}
        width={160}
        height={42}
        priority
        className="h-15 w-15 select-none"
      />
    </span>
  );

  const refreshAuth = useCallback(async () => {
    try {
      const me = await apiFetch<AuthMeResponse>("/api/v1/auth/me", {
        method: "GET",
        cache: "no-store",
      });
      const maybeName = resolveUserName(me);

      setIsAuthed(true);
      setUserLabel(maybeName);
    } catch {
      setIsAuthed(false);
      setUserLabel(null);
      setAccountOpen(false);
    }
  }, []);

  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);

    try {
      try {
        await apiFetch("/api/v1/auth/customer/logout", { method: "POST" });
      } catch {
        await apiFetch("/api/v1/auth/logout", { method: "POST" });
      }

      window.dispatchEvent(new Event("marima:auth-changed"));
      setAccountOpen(false);
      setMenuOpen(false);
      setSearchOpen(false);
      router.replace("/login");
      router.refresh();
    } catch {
      window.dispatchEvent(new Event("marima:auth-changed"));
      await refreshAuth();
    } finally {
      setLogoutLoading(false);
    }
  }

  useEffect(() => {
    void refreshAuth();

    const onAuthChanged = () => {
      void refreshAuth();
    };

    window.addEventListener("marima:auth-changed", onAuthChanged);

    return () => {
      window.removeEventListener("marima:auth-changed", onAuthChanged);
    };
  }, [refreshAuth]);

  useEffect(() => {
    setAccountOpen(false);
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node;
      const btn = accountButtonRef.current;
      const panel = accountPanelRef.current;

      if (!btn || !panel) return;
      const clickedInside = btn.contains(target) || panel.contains(target);
      if (!clickedInside) setAccountOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [accountOpen]);

  const accountMenu = isAuthed ? (
    <div className="relative">
      <button
        ref={accountButtonRef}
        type="button"
        aria-label="Minha conta"
        aria-haspopup="menu"
        aria-expanded={accountOpen}
        onClick={() => {
          setAccountOpen((v) => !v);
          setSearchOpen(false);
        }}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <User className="h-4.5 w-4.5" />
      </button>

      {accountOpen ? (
        <div
          ref={accountPanelRef}
          role="menu"
          aria-label="Menu da conta"
          className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[260px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
        >
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Conta</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {userLabel ? `Olá, ${userLabel}` : "Acessos da sua conta"}
            </p>
          </div>

          <div className="h-px bg-zinc-100" />

          <div className="p-2">
            <Link
              href="/dashboard"
              role="menuitem"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              onClick={() => {
                setAccountOpen(false);
                setMenuOpen(false);
              }}
            >
              Dados pessoais
              <span className="text-xs text-zinc-500">→</span>
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {logoutLoading ? "Saindo..." : "Sair"}
              <span className="text-xs text-rose-600">⎋</span>
            </button>
          </div>

          <div className="h-px bg-zinc-100" />

          <div className="px-4 py-3">
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Dica: se sua sessão expirar, você será direcionado para fazer login novamente.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  ) : (
    <Link
      href="/login"
      aria-label="Minha conta"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <User className="h-4.5 w-4.5" />
    </Link>
  );

  return (
    <header className="sticky top-0 z-50">
      <TopBar />

      <div className="bg-white">
        <Container>
          <div className="flex h-[72px] items-center justify-between border-b border-zinc-100">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2 text-zinc-900 shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 lg:hidden"
                aria-label="Abrir menu"
                onClick={() => {
                  setMenuOpen(true);
                  setAccountOpen(false);
                  setSearchOpen(false);
                }}
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link
                href="/"
                aria-label={SITE_COPY.brand}
                className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
              >
                {logo}
              </Link>
            </div>

            <nav className="hidden items-center justify-center gap-6 lg:flex" aria-label="Navegação principal">
              {nav.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href.split("?")[0] ?? "");
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1 text-sm font-medium text-zinc-700 transition hover:text-zinc-900",
                      active && "text-zinc-900",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <IconButton
                aria-label="Buscar produtos"
                onClick={() => {
                  setSearchOpen((value) => !value);
                  setMenuOpen(false);
                  setAccountOpen(false);
                }}
              >
                <Search className="h-4.5 w-4.5" />
              </IconButton>

              {accountMenu}

              <Link
                href="/dashboard/favoritos"
                aria-label="Favoritos"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:inline-flex"
              >
                <Heart className="h-4.5 w-4.5" />
              </Link>

              <div className="inline-flex">
                <CartTrigger className="h-10 w-10" />
              </div>
            </div>
          </div>
        </Container>
      </div>

      {searchOpen ? (
        <div className="border-b border-zinc-100 bg-white">
          <Container>
            <form onSubmit={submitSearch} className="flex gap-2 py-3">
              <label htmlFor="header-search" className="sr-only">
                Buscar produtos
              </label>
              <input
                id="header-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar leggings, tops, conjuntos..."
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                Buscar
              </button>
            </form>
          </Container>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="h-full w-[88%] max-w-sm bg-white p-5 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Link
                href="/"
                aria-label={SITE_COPY.brand}
                className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25"
                onClick={() => setMenuOpen(false)}
              >
                {logo}
              </Link>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-50"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitSearch} className="mt-5 flex gap-2">
              <label htmlFor="header-search-mobile" className="sr-only">
                Buscar produtos
              </label>
              <input
                id="header-search-mobile"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar produtos"
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                Ir
              </button>
            </form>

            <div className="mt-5 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {isAuthed ? (
              <div className="mt-6 rounded-2xl bg-zinc-50 p-3 ring-1 ring-black/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Sua conta</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {userLabel ? `Olá, ${userLabel}` : "Acessos da sua conta"}
                </p>

                <div className="mt-3 grid gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-10 items-center justify-between rounded-xl bg-white px-4 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    Dados pessoais
                    <span className="text-xs text-zinc-500">→</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="inline-flex h-10 items-center justify-between rounded-xl bg-rose-50 px-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-200/70 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {logoutLoading ? "Saindo..." : "Sair"}
                    <span className="text-xs text-rose-600">⎋</span>
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex items-center gap-2">
              <Link
                href={isAuthed ? "/dashboard" : "/login"}
                onClick={() => setMenuOpen(false)}
                aria-label="Minha conta"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <User className="h-4.5 w-4.5" />
              </Link>

              <Link
                href="/dashboard/favoritos"
                onClick={() => setMenuOpen(false)}
                aria-label="Favoritos"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Heart className="h-4.5 w-4.5" />
              </Link>

              <div className="inline-flex">
                <CartTrigger className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
