"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testIntegrationWebhookHandler = exports.patchIntegrationHandler = exports.listIntegrationsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const integrations_service_1 = require("../services/integrations.service");
exports.listIntegrationsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const result = await (0, integrations_service_1.listIntegrations)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
    });
    res.json(result);
});
exports.patchIntegrationHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, integrations_service_1.updateIntegration)(String(req.params.id), req.body);
    res.json({ data });
});
exports.testIntegrationWebhookHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, integrations_service_1.testIntegrationWebhook)(String(req.params.id));
    res.json({ data });
});
