"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationConfigModel = void 0;
const mongoose_1 = require("mongoose");
const integrationConfigSchema = new mongoose_1.Schema({
    group: {
        type: String,
        enum: ["pagamentos", "frete", "email", "whatsapp", "analytics", "pixel"],
        required: true,
        index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    connected: { type: Boolean, default: false, index: true },
    config: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
exports.IntegrationConfigModel = mongoose_1.models.IntegrationConfig || (0, mongoose_1.model)("IntegrationConfig", integrationConfigSchema);
