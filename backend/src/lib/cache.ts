import { createHash } from "crypto";
import { env } from "../config/env";
import { getRedisClient } from "./redis";

function shouldDebug() {
  return Boolean(env.CACHE_DEBUG);
}

function log(message: string) {
  if (!shouldDebug()) return;
  console.log(message);
}

function stringifyStable(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyStable(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stringifyStable(val)}`).join(",")}}`;
}

export function hashCacheQuery(input: unknown) {
  const payload = stringifyStable(input);
  return createHash("sha1").update(payload).digest("hex").slice(0, 16);
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number) {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    log(`[cache] SET_ERROR key=${key} message="${(error as Error).message}"`);
  }
}

export async function delCache(key: string) {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    log(`[cache] DEL_ERROR key=${key} message="${(error as Error).message}"`);
  }
}

export async function delByPrefix(prefix: string) {
  const client = getRedisClient();
  if (!client) return;

  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", "200");
      cursor = nextCursor;

      if (keys.length) {
        await client.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    log(`[cache] DEL_PREFIX_ERROR prefix=${prefix} message="${(error as Error).message}"`);
  }
}

export async function getCacheVersion(key: string, fallback = 1) {
  const client = getRedisClient();
  if (!client) return fallback;

  try {
    const current = await client.get(key);
    if (!current) {
      await client.set(key, String(fallback));
      return fallback;
    }

    const parsed = Number(current);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
  } catch (error) {
    log(`[cache] VERSION_GET_ERROR key=${key} message="${(error as Error).message}"`);
    return fallback;
  }
}

export async function bumpCacheVersion(key: string) {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.incr(key);
  } catch (error) {
    log(`[cache] VERSION_BUMP_ERROR key=${key} message="${(error as Error).message}"`);
  }
}

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
) {
  const client = getRedisClient();
  if (!client) {
    return fetcher();
  }

  try {
    const cached = await client.get(key);
    if (cached) {
      log(`[cache] HIT key=${key}`);
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    log(`[cache] GET_ERROR key=${key} message="${(error as Error).message}"`);
  }

  log(`[cache] MISS key=${key}`);
  const fresh = await fetcher();
  await setCache(key, fresh, ttlSeconds);
  return fresh;
}
