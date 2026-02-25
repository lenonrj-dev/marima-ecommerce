export const CONSENT_STORAGE_KEY = "marima_cookie_consent_v1";
export const CONSENT_SCHEMA_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 180;
export const CONSENT_CHANGED_EVENT = "marima:cookie-consent-changed";

const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export type CookieConsentValue = "accepted" | "declined";

type ConsentStorageRecord = {
  value: CookieConsentValue;
  ts: number;
  v: number;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function emitConsentEvent(value: CookieConsentValue | null) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }));
}

function parseRecord(raw: string | null): ConsentStorageRecord | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentStorageRecord>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.v !== CONSENT_SCHEMA_VERSION) return null;
    if (parsed.value !== "accepted" && parsed.value !== "declined") return null;
    if (typeof parsed.ts !== "number" || !Number.isFinite(parsed.ts) || parsed.ts <= 0) return null;
    return {
      value: parsed.value,
      ts: parsed.ts,
      v: parsed.v,
    };
  } catch {
    return null;
  }
}

function isExpired(ts: number) {
  return Date.now() - ts > CONSENT_MAX_AGE_MS;
}

export function getConsent(): CookieConsentValue | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    const record = parseRecord(raw);

    if (!record) {
      if (raw !== null) {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      }
      return null;
    }

    if (isExpired(record.ts)) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }

    return record.value;
  } catch {
    return null;
  }
}

export function setConsent(value: CookieConsentValue) {
  if (!isBrowser()) return;

  const record: ConsentStorageRecord = {
    value,
    ts: Date.now(),
    v: CONSENT_SCHEMA_VERSION,
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage failures and still notify listeners.
  }

  emitConsentEvent(value);
}

export function clearConsent() {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }

  emitConsentEvent(null);
}

