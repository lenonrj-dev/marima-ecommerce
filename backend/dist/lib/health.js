"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHealthChecks = runHealthChecks;
const prisma_1 = require("./prisma");
const redis_1 = require("./redis");
async function runHealthChecks() {
    const checks = {
        database: { status: "ok" },
        redis: { status: "skipped", message: "REDIS_URL não configurada" },
    };
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        checks.database = { status: "ok" };
    }
    catch (error) {
        checks.database = {
            status: "error",
            message: error instanceof Error ? error.message : "falha ao consultar banco",
        };
    }
    const redis = (0, redis_1.getRedisClient)();
    if (redis) {
        try {
            const pong = await redis.ping();
            checks.redis = {
                status: pong === "PONG" ? "ok" : "error",
                message: pong === "PONG" ? undefined : `resposta inesperada: ${pong}`,
            };
        }
        catch (error) {
            checks.redis = {
                status: "error",
                message: error instanceof Error ? error.message : "falha ao consultar redis",
            };
        }
    }
    const ok = checks.database.status === "ok" && checks.redis.status !== "error";
    return { ok, checks };
}
