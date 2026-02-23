"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listIntegrations = listIntegrations;
exports.updateIntegration = updateIntegration;
exports.testIntegrationWebhook = testIntegrationWebhook;
exports.toIntegration = toIntegration;
const prisma_1 = require("../lib/prisma");
const pagination_1 = require("../utils/pagination");
const apiError_1 = require("../utils/apiError");
function toIntegration(row) {
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
async function listIntegrations(input) {
    const where = {};
    if (input.q) {
        where.OR = [
            { group: { contains: input.q, mode: "insensitive" } },
            { name: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
        ];
    }
    const [rows, total] = await Promise.all([
        prisma_1.prisma.integrationConfig.findMany({
            where,
            orderBy: [{ group: "asc" }, { createdAt: "desc" }],
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.integrationConfig.count({ where }),
    ]);
    return { data: rows.map(toIntegration), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function updateIntegration(id, input) {
    const item = await prisma_1.prisma.integrationConfig.findUnique({ where: { id } });
    if (!item)
        throw new apiError_1.ApiError(404, "Integra��o n�o encontrada.");
    const updated = await prisma_1.prisma.integrationConfig.update({
        where: { id },
        data: {
            ...(input.connected !== undefined ? { connected: input.connected } : {}),
            ...(input.config !== undefined ? { config: input.config } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.name !== undefined ? { name: input.name } : {}),
        },
    });
    return toIntegration(updated);
}
async function testIntegrationWebhook(id) {
    const item = await prisma_1.prisma.integrationConfig.findUnique({ where: { id } });
    if (!item)
        throw new apiError_1.ApiError(404, "Integra��o n�o encontrada.");
    return {
        id,
        ok: true,
        message: `Webhook de ${item.name} testado com sucesso (stub).`,
        testedAt: new Date().toISOString(),
    };
}
