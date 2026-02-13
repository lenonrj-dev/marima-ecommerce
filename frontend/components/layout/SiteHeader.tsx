"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import TopBar from "@/components/layout/TopBar";
import IconButton from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { Heart, Menu, Search, User, X } from "lucide-react";
import CartTrigger from "@/components/cart/CartTrigger";
import { MAIN_NAV, SITE_COPY } from "@/lib/siteCopy";

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const nav = useMemo(() => MAIN_NAV, []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim();
    const url = term ? `/produtos?search=${encodeURIComponent(term)}` : "/produtos";
    router.push(url);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  const logo = (
    <>
      {SITE_COPY.brand.toLowerCase()}
      <span className="text-zinc-900">.</span>
    </>
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
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/" className="text-xl font-semibold tracking-tight text-zinc-900">
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
                }}
              >
                <Search className="h-4.5 w-4.5" />
              </IconButton>

              <Link
                href="/dashboard"
                aria-label="Minha conta"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <User className="h-4.5 w-4.5" />
              </Link>

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
                className="text-lg font-semibold tracking-tight text-zinc-900"
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

            <div className="mt-6 flex items-center gap-2">
              <Link
                href="/dashboard"
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
