import { FilterQuery } from "mongoose";
import { IntegrationConfigModel } from "../models/IntegrationConfig";
import { buildMeta } from "../utils/pagination";
import { ApiError } from "../utils/apiError";

function toIntegration(row: any) {
  return {
    id: String(row._id),
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
  const query: FilterQuery<any> = {};
  if (input.q) {
    query.$or = [
      { group: { $regex: input.q, $options: "i" } },
      { name: { $regex: input.q, $options: "i" } },
      { description: { $regex: input.q, $options: "i" } },
    ];
  }

  const [rows, total] = await Promise.all([
    IntegrationConfigModel.find(query)
      .sort({ group: 1, createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    IntegrationConfigModel.countDocuments(query),
  ]);

  return { data: rows.map(toIntegration), meta: buildMeta(total, input.page, input.limit) };
}

export async function updateIntegration(id: string, input: Partial<{ connected: boolean; config: Record<string, unknown>; description: string; name: string }>) {
  const item = await IntegrationConfigModel.findById(id);
  if (!item) throw new ApiError(404, "Integração não encontrada.");

  if (input.connected !== undefined) item.connected = input.connected;
  if (input.config !== undefined) item.config = input.config;
  if (input.description !== undefined) item.description = input.description;
  if (input.name !== undefined) item.name = input.name;

  await item.save();
  return toIntegration(item);
}

export async function testIntegrationWebhook(id: string) {
  const item = await IntegrationConfigModel.findById(id);
  if (!item) throw new ApiError(404, "Integração não encontrada.");

  return {
    id,
    ok: true,
    message: `Webhook de ${item.name} testado com sucesso (stub).`,
    testedAt: new Date().toISOString(),
  };
}

export { toIntegration };
