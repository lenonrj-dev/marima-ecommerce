const RAW_PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL;
const RAW_SERVER_API_BASE = process.env.API_URL;
const PROXY_API_BASE = "/api";

function normalizeApiBase(base: string) {
  return base.trim().replace(/\/+$/, "");
}

function resolveApiBase() {
  const publicBase = typeof RAW_PUBLIC_API_BASE === "string" ? normalizeApiBase(RAW_PUBLIC_API_BASE) : "";
  const serverBase = typeof RAW_SERVER_API_BASE === "string" ? normalizeApiBase(RAW_SERVER_API_BASE) : "";

  if (typeof window === "undefined") {
    return publicBase || serverBase || PROXY_API_BASE;
  }

  return publicBase || PROXY_API_BASE;
}

export const API_BASE = resolveApiBase();

let warnedMissingApiBase = false;

function getApiBase() {
  if (!API_BASE) {
    if (typeof window !== "undefined" && !warnedMissingApiBase) {
      warnedMissingApiBase = true;
      console.error("NEXT_PUBLIC_API_URL nao configurado. Usando fallback relativo /api.");
    }
    return PROXY_API_BASE;
  }

  if (process.env.NODE_ENV === "production" && /^http:\/\//i.test(API_BASE)) {
    throw new Error("Config invalida: a base da API deve usar HTTPS em producao.");
  }

  return API_BASE;
}

export type ApiListResponse<T> = {
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

type ApiFetchOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
  skipAuthRedirect?: boolean;
  __authRetry?: boolean;
};

export class HttpError extends Error {
  status: number;
  payload?: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export type AuthExpiredEvent = {
  status: number;
  code?: string;
  message?: string;
  path: string;
};

type AuthExpiredListener = (event: AuthExpiredEvent) => void;

const authExpiredListeners = new Set<AuthExpiredListener>();
let lastAuthExpiredAt = 0;
const AUTH_EXPIRED_COOLDOWN_MS = 1500;
let refreshPromise: Promise<boolean> | null = null;

export function onAuthExpired(listener: AuthExpiredListener) {
  authExpiredListeners.add(listener);
  return () => {
    authExpiredListeners.delete(listener);
  };
}

function emitAuthExpired(event: AuthExpiredEvent) {
  const now = Date.now();
  if (now - lastAuthExpiredAt < AUTH_EXPIRED_COOLDOWN_MS) return;
  lastAuthExpiredAt = now;

  if (typeof window !== "undefined" && authExpiredListeners.size === 0) {
    const current = new URL(window.location.href);
    const shouldRedirect =
      current.pathname !== "/login" || current.searchParams.get("reason") !== "session-expired";

    if (shouldRedirect) {
      window.location.assign("/login?reason=session-expired");
    }
    return;
  }

  for (const listener of authExpiredListeners) {
    try {
      listener(event);
    } catch {
      // Ignore listener errors.
    }
  }
}

function withQuery(path: string, query?: ApiFetchOptions["query"]) {
  if (!query) return path;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function joinApiPath(base: string, path: string) {
  if (isAbsoluteUrl(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalizedPath;

  const normalizedBase = normalizeApiBase(base);

  // Evita "/api/api/*" quando o path ja inclui o prefixo da API.
  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function isJsonContentType(contentType: string | null) {
  return (contentType || "").toLowerCase().includes("application/json");
}

function getPayloadCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  if (!("code" in payload)) return undefined;
  const value = (payload as Record<string, unknown>).code;
  return typeof value === "string" ? value : undefined;
}

export function buildApiUrl(path: string, query?: ApiFetchOptions["query"]) {
  return joinApiPath(getApiBase(), withQuery(path, query));
}

function shouldAttemptRefresh(path: string, code?: string) {
  const normalized = path.toLowerCase();
  if (normalized.includes("/api/v1/auth/refresh")) return false;
  if (normalized.includes("/api/v1/auth/customer/login")) return false;
  if (normalized.includes("/api/v1/auth/customer/register")) return false;
  if (normalized.includes("/api/v1/auth/admin/login")) return false;
  if (normalized.includes("/api/v1/auth/logout")) return false;
  if (normalized.includes("/api/v1/auth/customer/logout")) return false;
  if (normalized.includes("/api/v1/auth/admin/logout")) return false;
  return code === "AUTH_EXPIRED" || code === "AUTH_REQUIRED" || code === undefined;
}

async function tryRefreshSession(base: string, skipNgrokWarning: boolean) {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshUrl = joinApiPath(base, "/api/v1/auth/refresh");
      const response = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: skipNgrokWarning ? { "ngrok-skip-browser-warning": "true" } : undefined,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { query, skipAuthRedirect = false, __authRetry = false, ...requestOptions } = options;
  const base = getApiBase();
  const url = joinApiPath(base, withQuery(path, query));
  const hasJsonBody = typeof requestOptions.body === "string";
  const skipNgrokWarning = base.includes("ngrok");
  const headers = {
    ...(skipNgrokWarning ? { "ngrok-skip-browser-warning": "true" } : {}),
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(requestOptions.headers || {}),
  };

  const response = await fetch(url, {
    ...requestOptions,
    headers,
    credentials: "include",
    cache: requestOptions.cache ?? "no-store",
  });

  const contentType = response.headers.get("content-type");
  const payload = isJsonContentType(contentType) ? await response.json() : await response.text();

  if (!response.ok) {
    const code = getPayloadCode(payload);
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as Record<string, unknown>).message || "Falha na requisicao")
        : "Falha na requisicao";

    if (response.status === 401 && !__authRetry && shouldAttemptRefresh(path, code)) {
      const refreshed = await tryRefreshSession(base, skipNgrokWarning);
      if (refreshed) {
        return apiFetch<T>(path, {
          ...options,
          skipAuthRedirect: true,
          __authRetry: true,
        });
      }
    }

    if (!skipAuthRedirect && response.status === 401 && code !== "AUTH_INVALID_CREDENTIALS") {
      if (code === "AUTH_EXPIRED" || code === undefined) {
        emitAuthExpired({ status: response.status, code, message, path });
      }
    }

    const finalMessage =
      response.status === 401 && (code === "AUTH_EXPIRED" || code === undefined)
        ? "Sua sessao expirou. Faca login novamente para continuar."
        : message;

    throw new HttpError(response.status, finalMessage, payload);
  }

  return payload as T;
}
