"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreSettings = getStoreSettings;
exports.updateStoreSettings = updateStoreSettings;
exports.toSettings = toSettings;
const StoreSettings_1 = require("../models/StoreSettings");
function toSettings(settings) {
    return {
        id: String(settings._id),
        name: settings.name,
        domain: settings.domain,
        timezone: settings.timezone,
        currency: settings.currency,
        supportEmail: settings.supportEmail,
        policy: settings.policy,
        createdAt: settings.createdAt?.toISOString(),
        updatedAt: settings.updatedAt?.toISOString(),
    };
}
async function getStoreSettings() {
    let settings = await StoreSettings_1.StoreSettingsModel.findOne();
    if (!settings) {
        settings = await StoreSettings_1.StoreSettingsModel.create({
            name: "Minha Loja",
            domain: "minhaloja.com",
            timezone: "America/Sao_Paulo",
            currency: "BRL",
            supportEmail: "suporte@minhaloja.com",
            policy: "Trocas em até 7 dias. Consulte regras no site.",
        });
    }
    return toSettings(settings);
}
async function updateStoreSettings(input) {
    let settings = await StoreSettings_1.StoreSettingsModel.findOne();
    if (!settings) {
        settings = await StoreSettings_1.StoreSettingsModel.create({
            name: input.name || "Minha Loja",
            domain: input.domain || "minhaloja.com",
            timezone: input.timezone || "America/Sao_Paulo",
            currency: input.currency || "BRL",
            supportEmail: input.supportEmail || "suporte@minhaloja.com",
            policy: input.policy || "",
        });
    }
    else {
        Object.assign(settings, input);
        await settings.save();
    }
    return toSettings(settings);
}
