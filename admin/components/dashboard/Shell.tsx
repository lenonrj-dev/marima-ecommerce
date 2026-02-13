"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { apiFetch, HttpError, onAuthExpired } from "../../lib/api";

type AdminSession = {
  id: string;
  type: "admin";
  name: string;
  email: string;
  role: "admin" | "operacao" | "marketing" | "suporte";
  active: boolean;
};

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [openMobile, setOpenMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<AdminSession | null>(null);

  const contentRef = useRef<HTMLElement>(null);
  const logoutLock = useRef(false);

  const forceLogout = useCallback(
    (reason: "expired" | "unauthorized") => {
      if (logoutLock.current) return;
      logoutLock.current = true;

      setUser(null);
      setOpenMobile(false);

      void (async () => {
        try {
          await apiFetch("/api/v1/auth/logout", { method: "POST" });
        } catch {
          // Ignore logout failures.
        } finally {
          const target = reason === "expired" ? "/login?reason=session-expired" : "/login";
          router.replace(target);
          router.refresh();
        }
      })();
    },
    [router],
  );

  useEffect(() => onAuthExpired(() => forceLogout("expired")), [forceLogout]);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await apiFetch<{ data: AdminSession }>("/api/v1/auth/me");

        if (!active) return;

        if (!response?.data || response.data.type !== "admin") {
          router.replace("/login");
          return;
        }

        setUser(response.data);
      } catch (err) {
        if (!active) return;

        if (err instanceof HttpError && err.status === 401) {
          const code =
            typeof err.payload === "object" && err.payload !== null && "code" in err.payload
              ? String((err.payload as Record<string, unknown>).code || "")
              : "";

          if (code === "AUTH_EXPIRED") {
            forceLogout("expired");
            return;
          }
        }

        router.replace("/login");
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!openMobile) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openMobile]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const updateScrollState = () => {
      const top = node.scrollTop;
      setScrolled(top > 8);
    };

    updateScrollState();

    node.addEventListener("scroll", updateScrollState, { passive: true });

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, []);

  const handleLogout = useCallback(() => forceLogout("unauthorized"), [forceLogout]);

  if (checkingAuth) {
    return (
      <div className="grid h-dvh place-items-center bg-[linear-gradient(180deg,#f5f4fb_0%,#eceaf6_100%)]">
        <div className="w-56 space-y-3">
          <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
          <p className="text-center text-xs font-medium text-slate-500">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(1200px_720px_at_0%_0%,rgba(139,92,246,0.14),transparent_58%),radial-gradient(980px_620px_at_100%_0%,rgba(124,58,237,0.10),transparent_54%),linear-gradient(180deg,#f5f4fb_0%,#eceaf6_100%)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-2xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:ring-2 focus:ring-violet-300"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[320px] border-r border-slate-200/70 bg-[#F8F7FD]/95 backdrop-blur-md lg:block">
        <Sidebar user={user} onLogout={handleLogout} />
      </aside>

      <div className="h-dvh min-w-0 lg:ml-[320px]">
        <main
          id="conteudo"
          ref={contentRef}
          className="scroll-area relative h-dvh min-w-0 overflow-x-hidden overflow-y-auto"
          aria-label="Conteúdo principal"
        >
          <Topbar scrolled={scrolled} onOpenSidebar={() => setOpenMobile(true)} />

          <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">{children}</div>
        </main>
      </div>

      {openMobile ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
            onClick={() => setOpenMobile(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[340px] border-r border-slate-200/70 bg-[#F8F7FD] shadow-[0_26px_80px_rgba(15,23,42,0.28)]">
            <Sidebar user={user} onNavigate={() => setOpenMobile(false)} onLogout={handleLogout} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
