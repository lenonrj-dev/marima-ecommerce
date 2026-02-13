const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
  return `${API_BASE.replace(/\/$/, "")}${withQuery(path, query)}`;
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = buildApiUrl(path, options.query);
  const hasJsonBody = typeof options.body === "string";
  const headers = {
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const payload = isJsonContentType(contentType) ? await response.json() : await response.text();

  if (!response.ok) {
    const code = getPayloadCode(payload);
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as Record<string, unknown>).message || "Falha na requisição")
        : "Falha na requisição";

    if (response.status === 401 && code !== "AUTH_INVALID_CREDENTIALS") {
      if (code === "AUTH_EXPIRED" || code === undefined) {
        emitAuthExpired({ status: response.status, code, message, path });
      }
    }

    const finalMessage =
      response.status === 401 && (code === "AUTH_EXPIRED" || code === undefined)
        ? "Sua sessão expirou. Faça login novamente para continuar."
        : message;

    throw new HttpError(response.status, finalMessage, payload);
  }

  return payload as T;
}

export { API_BASE };
