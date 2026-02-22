"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashCacheQuery = hashCacheQuery;
exports.setCache = setCache;
exports.delCache = delCache;
exports.delByPrefix = delByPrefix;
exports.getCacheVersion = getCacheVersion;
exports.bumpCacheVersion = bumpCacheVersion;
exports.getOrSetCache = getOrSetCache;
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const redis_1 = require("./redis");
function shouldDebug() {
    return Boolean(env_1.env.CACHE_DEBUG);
}
function log(message) {
    if (!shouldDebug())
        return;
    console.log(message);
}
function stringifyStable(value) {
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((item) => stringifyStable(item)).join(",")}]`;
    }
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stringifyStable(val)}`).join(",")}}`;
}
function hashCacheQuery(input) {
    const payload = stringifyStable(input);
    return (0, crypto_1.createHash)("sha1").update(payload).digest("hex").slice(0, 16);
}
async function setCache(key, value, ttlSeconds) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return;
    try {
        await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    }
    catch (error) {
        log(`[cache] SET_ERROR key=${key} message="${error.message}"`);
    }
}
async function delCache(key) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return;
    try {
        await client.del(key);
    }
    catch (error) {
        log(`[cache] DEL_ERROR key=${key} message="${error.message}"`);
    }
}
async function delByPrefix(prefix) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return;
    try {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", "200");
            cursor = nextCursor;
            if (keys.length) {
                await client.del(...keys);
            }
        } while (cursor !== "0");
    }
    catch (error) {
        log(`[cache] DEL_PREFIX_ERROR prefix=${prefix} message="${error.message}"`);
    }
}
async function getCacheVersion(key, fallback = 1) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return fallback;
    try {
        const current = await client.get(key);
        if (!current) {
            await client.set(key, String(fallback));
            return fallback;
        }
        const parsed = Number(current);
        if (!Number.isFinite(parsed) || parsed <= 0)
            return fallback;
        return Math.floor(parsed);
    }
    catch (error) {
        log(`[cache] VERSION_GET_ERROR key=${key} message="${error.message}"`);
        return fallback;
    }
}
async function bumpCacheVersion(key) {
    const client = (0, redis_1.getRedisClient)();
    if (!client)
        return;
    try {
        await client.incr(key);
    }
    catch (error) {
        log(`[cache] VERSION_BUMP_ERROR key=${key} message="${error.message}"`);
    }
}
async function getOrSetCache(key, ttlSeconds, fetcher) {
    const client = (0, redis_1.getRedisClient)();
    if (!client) {
        return fetcher();
    }
    try {
        const cached = await client.get(key);
        if (cached) {
            log(`[cache] HIT key=${key}`);
            return JSON.parse(cached);
        }
    }
    catch (error) {
        log(`[cache] GET_ERROR key=${key} message="${error.message}"`);
    }
    log(`[cache] MISS key=${key}`);
    const fresh = await fetcher();
    await setCache(key, fresh, ttlSeconds);
    return fresh;
}
