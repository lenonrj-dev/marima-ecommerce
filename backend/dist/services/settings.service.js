"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreSettings = getStoreSettings;
exports.updateStoreSettings = updateStoreSettings;
exports.toSettings = toSettings;
const prisma_1 = require("../lib/prisma");
function toSettings(settings) {
    return {
        id: String(settings.id),
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
    let settings = await prisma_1.prisma.storeSettings.findFirst();
    if (!settings) {
        settings = await prisma_1.prisma.storeSettings.create({
            data: {
                name: "Minha Loja",
                domain: "minhaloja.com",
                timezone: "America/Sao_Paulo",
                currency: "BRL",
                supportEmail: "suporte@minhaloja.com",
                policy: "Trocas em at� 7 dias. Consulte regras no site.",
            },
        });
    }
    return toSettings(settings);
}
async function updateStoreSettings(input) {
    let settings = await prisma_1.prisma.storeSettings.findFirst();
    if (!settings) {
        settings = await prisma_1.prisma.storeSettings.create({
            data: {
                name: input.name || "Minha Loja",
                domain: input.domain || "minhaloja.com",
                timezone: input.timezone || "America/Sao_Paulo",
                currency: input.currency || "BRL",
                supportEmail: input.supportEmail || "suporte@minhaloja.com",
                policy: input.policy || "",
            },
        });
    }
    else {
        settings = await prisma_1.prisma.storeSettings.update({
            where: { id: settings.id },
            data: input,
        });
    }
    return toSettings(settings);
}
