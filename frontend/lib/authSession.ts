import { apiFetch } from "@/lib/api";

const FALLBACK_NEXT = "/dashboard";

export function sanitizeNextPath(value: string | null | undefined, fallback = FALLBACK_NEXT) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  if (!decoded.startsWith("/")) return fallback;
  if (decoded.startsWith("//")) return fallback;
  return decoded;
}

export function buildLoginUrl(nextPath: string) {
  const safeNext = sanitizeNextPath(nextPath, "/checkout");
  return `/login?next=${encodeURIComponent(safeNext)}`;
}

export async function isAuthenticated() {
  try {
    await apiFetch("/api/v1/auth/me", {
      method: "GET",
      cache: "no-store",
      skipAuthRedirect: true,
    });
    return true;
  } catch {
    return false;
  }
}
