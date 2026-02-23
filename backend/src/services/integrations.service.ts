import { prisma } from "../lib/prisma";
import { buildMeta } from "../utils/pagination";
import { ApiError } from "../utils/apiError";

function toIntegration(row: any) {
  return {
    id: String(row.id),
    group: row.group,
    name: row.name,
    description: row.description,
    connected: row.connected,
    config: row.config || {},
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export async function listIntegrations(input: { page: number; limit: number; q?: string }) {
  const where: any = {};
  if (input.q) {
    where.OR = [
      { group: { contains: input.q, mode: "insensitive" } },
      { name: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.integrationConfig.findMany({
      where,
      orderBy: [{ group: "asc" }, { createdAt: "desc" }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.integrationConfig.count({ where }),
  ]);

  return { data: rows.map(toIntegration), meta: buildMeta(total, input.page, input.limit) };
}

export async function updateIntegration(
  id: string,
  input: Partial<{ connected: boolean; config: Record<string, unknown>; description: string; name: string }>,
) {
  const item = await prisma.integrationConfig.findUnique({ where: { id } });
  if (!item) throw new ApiError(404, "Integração não encontrada.");

  const updated = await prisma.integrationConfig.update({
    where: { id },
    data: {
      ...(input.connected !== undefined ? { connected: input.connected } : {}),
      ...(input.config !== undefined ? { config: input.config as any } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
    },
  });

  return toIntegration(updated);
}

export async function testIntegrationWebhook(id: string) {
  const item = await prisma.integrationConfig.findUnique({ where: { id } });
  if (!item) throw new ApiError(404, "Integração não encontrada.");

  return {
    id,
    ok: true,
    message: `Webhook de ${item.name} testado com sucesso (stub).`,
    testedAt: new Date().toISOString(),
  };
}

export { toIntegration };
