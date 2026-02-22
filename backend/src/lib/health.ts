import { prisma } from "./prisma";
import { getRedisClient } from "./redis";

type CheckStatus = "ok" | "error" | "skipped";

export type HealthResult = {
  ok: boolean;
  checks: {
    database: { status: CheckStatus; message?: string };
    redis: { status: CheckStatus; message?: string };
  };
};

export async function runHealthChecks(): Promise<HealthResult> {
  const checks: HealthResult["checks"] = {
    database: { status: "ok" },
    redis: { status: "skipped", message: "REDIS_URL não configurada" },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (error) {
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "falha ao consultar banco",
    };
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const pong = await redis.ping();
      checks.redis = {
        status: pong === "PONG" ? "ok" : "error",
        message: pong === "PONG" ? undefined : `resposta inesperada: ${pong}`,
      };
    } catch (error) {
      checks.redis = {
        status: "error",
        message: error instanceof Error ? error.message : "falha ao consultar redis",
      };
    }
  }

  const ok = checks.database.status === "ok" && checks.redis.status !== "error";
  return { ok, checks };
}
