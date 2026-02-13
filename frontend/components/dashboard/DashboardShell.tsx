"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import { apiFetch, HttpError } from "@/lib/api";

type CustomerSession = {
  id: string;
  type: "customer";
  name: string;
  email: string;
  phone?: string;
  segment?: string;
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [session, setSession] = useState<CustomerSession | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const response = await apiFetch<{ data: CustomerSession | { type: string } }>("/api/v1/auth/me");

        if (!active) return;

        if (!response.data || response.data.type !== "customer") {
          router.replace("/login");
          return;
        }

        setSession(response.data as CustomerSession);
      } catch (err) {
        if (!active) return;

        if (err instanceof HttpError && err.status === 401) {
          const code =
            typeof err.payload === "object" && err.payload !== null && "code" in err.payload
              ? String((err.payload as Record<string, unknown>).code || "")
              : "";

          if (code === "AUTH_EXPIRED") {
            router.replace("/login?reason=session-expired");
            return;
          }
        }

        router.replace("/login");
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  const handleLogout = useCallback(() => {
    void (async () => {
      try {
        await apiFetch("/api/v1/auth/logout", { method: "POST" });
      } finally {
        window.dispatchEvent(new Event("marima:auth-changed"));
        router.replace("/login");
        router.refresh();
      }
    })();
  }, [router]);

  if (loadingSession) {
    return (
      <div className="bg-zinc-50">
        <DashboardTopbar user={session} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-soft">
            Carregando sua conta...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50">
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-900 focus:shadow-soft focus:outline-none"
      >
        Pular para o conteúdo
      </a>

      <DashboardTopbar user={session} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold text-zinc-900">Menu da conta</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="hidden lg:block">
            <DashboardSidebar user={session} onLogout={handleLogout} />
          </div>

          <main id="dashboard-content" className="min-w-0">
            {children}
          </main>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden>
          <div
            className="absolute right-0 top-0 h-full w-[90%] max-w-sm bg-zinc-50 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menu da conta"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900">Minha conta</p>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <DashboardSidebar
                user={session}
                onLogout={handleLogout}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
