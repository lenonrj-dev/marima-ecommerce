import { env } from "../config/env";
import { ApiError } from "./apiError";

export function normalizeBaseUrl(raw: string, label: string) {
  const value = String(raw || "").trim();
  if (!value) {
    throw new ApiError(400, `Config inválida: ${label} não informado.`, "INVALID_CONFIG");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ApiError(400, `Config inválida: ${label} deve ser uma URL válida.`, "INVALID_CONFIG");
  }

  return parsed.origin;
}

export function assertHttpsInProduction(url: string, label: string) {
  if (env.NODE_ENV !== "production") return;
  if (!url.startsWith("https://")) {
    throw new ApiError(400, `Config inválida: ${label} deve ser HTTPS em produção.`, "INVALID_CONFIG");
  }
}

