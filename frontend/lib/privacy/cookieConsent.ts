export const CONSENT_COOKIE_NAME = "marima_cookie_consent";
export const CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days
export const CONSENT_CHANGED_EVENT = "marima:cookie-consent-changed";

export type CookieConsentValue = "all" | "necessary";

const PUBLIC_COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim() || "";

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function parseCookieMap() {
  if (!isBrowser()) return new Map<string, string>();
  const map = new Map<string, string>();

  for (const part of document.cookie.split(";")) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey?.trim();
    if (!key) continue;
    map.set(key, rest.join("=").trim());
  }

  return map;
}

function matchesHost(hostname: string, configuredDomain: string) {
  const cleanDomain = configuredDomain.replace(/^\./, "").toLowerCase();
  const normalizedHost = hostname.toLowerCase();
  return normalizedHost === cleanDomain || normalizedHost.endsWith(`.${cleanDomain}`);
}

function resolveCookieDomain() {
  if (!isBrowser()) return undefined;
  if (!PUBLIC_COOKIE_DOMAIN) return undefined;
  return matchesHost(window.location.hostname, PUBLIC_COOKIE_DOMAIN) ? PUBLIC_COOKIE_DOMAIN : undefined;
}

function emitConsentEvent(value: CookieConsentValue | null) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
}

export function getConsent(): CookieConsentValue | null {
  const cookies = parseCookieMap();
  const value = cookies.get(CONSENT_COOKIE_NAME);
  if (value === "all" || value === "necessary") return value;
  return null;
}

export function setConsent(value: CookieConsentValue) {
  if (!isBrowser()) return;
  const isHttps = window.location.protocol === "https:";
  const domain = resolveCookieDomain();
  const chunks = [
    `${CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Max-Age=${CONSENT_COOKIE_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
  ];

  if (isHttps) chunks.push("Secure");
  if (domain) chunks.push(`Domain=${domain}`);

  document.cookie = chunks.join("; ");
  emitConsentEvent(value);
}

export function clearConsent() {
  if (!isBrowser()) return;
  const isHttps = window.location.protocol === "https:";
  const domain = resolveCookieDomain();
  const chunks = [
    `${CONSENT_COOKIE_NAME}=`,
    "Max-Age=0",
    "Path=/",
    "SameSite=Lax",
  ];

  if (isHttps) chunks.push("Secure");
  if (domain) chunks.push(`Domain=${domain}`);

  document.cookie = chunks.join("; ");
  emitConsentEvent(null);
}

