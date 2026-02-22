"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
let redisClient = null;
let disabled = false;
function shouldDebug() {
    return Boolean(env_1.env.CACHE_DEBUG);
}
function log(message) {
    if (!shouldDebug())
        return;
    console.log(message);
}
function getRedisClient() {
    if (env_1.env.NODE_ENV === "test")
        return null;
    if (disabled)
        return null;
    if (!env_1.env.REDIS_URL)
        return null;
    if (redisClient)
        return redisClient;
    redisClient = new ioredis_1.default(env_1.env.REDIS_URL, {
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
