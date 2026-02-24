import { prisma } from "../lib/prisma";

function toSettings(settings: any) {
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

export async function getStoreSettings() {
  let settings = await prisma.storeSettings.findFirst();

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        name: "Minha Loja",
        domain: "minhaloja.com",
        timezone: "America/Sao_Paulo",
        currency: "BRL",
        supportEmail: "suporte@minhaloja.com",
        policy: "Trocas em até 7 dias. Consulte regras no site.",
      },
    });
  }

  return toSettings(settings);
}

export async function updateStoreSettings(
  input: Partial<{ name: string; domain: string; timezone: string; currency: string; supportEmail: string; policy: string }>,
) {
  let settings = await prisma.storeSettings.findFirst();

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        name: input.name || "Minha Loja",
        domain: input.domain || "minhaloja.com",
        timezone: input.timezone || "America/Sao_Paulo",
        currency: input.currency || "BRL",
        supportEmail: input.supportEmail || "suporte@minhaloja.com",
        policy: input.policy || "",
      },
    });
  } else {
    settings = await prisma.storeSettings.update({
      where: { id: settings.id },
      data: input,
    });
  }

  return toSettings(settings);
}

export { toSettings };
