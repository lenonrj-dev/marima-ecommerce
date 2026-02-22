"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listIntegrations = listIntegrations;
exports.updateIntegration = updateIntegration;
exports.testIntegrationWebhook = testIntegrationWebhook;
exports.toIntegration = toIntegration;
const IntegrationConfig_1 = require("../models/IntegrationConfig");
const pagination_1 = require("../utils/pagination");
const apiError_1 = require("../utils/apiError");
function toIntegration(row) {
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
async function listIntegrations(input) {
    const query = {};
    if (input.q) {
        query.$or = [
            { group: { $regex: input.q, $options: "i" } },
            { name: { $regex: input.q, $options: "i" } },
            { description: { $regex: input.q, $options: "i" } },
        ];
    }
    const [rows, total] = await Promise.all([
        IntegrationConfig_1.IntegrationConfigModel.find(query)
            .sort({ group: 1, createdAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        IntegrationConfig_1.IntegrationConfigModel.countDocuments(query),
    ]);
    return { data: rows.map(toIntegration), meta: (0, pagination_1.buildMeta)(total, input.page, input.limit) };
}
async function updateIntegration(id, input) {
    const item = await IntegrationConfig_1.IntegrationConfigModel.findById(id);
    if (!item)
        throw new apiError_1.ApiError(404, "Integra��o n�o encontrada.");
    if (input.connected !== undefined)
        item.connected = input.connected;
    if (input.config !== undefined)
        item.config = input.config;
    if (input.description !== undefined)
        item.description = input.description;
    if (input.name !== undefined)
        item.name = input.name;
    await item.save();
    return toIntegration(item);
}
async function testIntegrationWebhook(id) {
    const item = await IntegrationConfig_1.IntegrationConfigModel.findById(id);
    if (!item)
        throw new apiError_1.ApiError(404, "Integra��o n�o encontrada.");
    return {
        id,
        ok: true,
        message: `Webhook de ${item.name} testado com sucesso (stub).`,
        testedAt: new Date().toISOString(),
    };
}
