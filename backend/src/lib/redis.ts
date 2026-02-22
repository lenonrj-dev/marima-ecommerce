import Redis from "ioredis";
import { env } from "../config/env";

let redisClient: Redis | null = null;
let disabled = false;

function shouldDebug() {
  return Boolean(env.CACHE_DEBUG);
}

function log(message: string) {
  if (!shouldDebug()) return;
  console.log(message);
}

export function getRedisClient() {
  if (env.NODE_ENV === "test") return null;
  if (disabled) return null;
  if (!env.REDIS_URL) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  redisClient.on("error", (error) => {
    log(`[cache] redis_error message="${error.message}"`);
  });

  redisClient.on("connect", () => {
    log("[cache] redis_connected");
  });

  redisClient.connect().catch((error) => {
    log(`[cache] redis_connect_failed message="${error.message}"`);
    disabled = true;
    if (redisClient) {
      redisClient.disconnect();
      redisClient = null;
    }
  });

  return redisClient;
}
