import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  SHADOW_DATABASE_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
  SESSION_MAX_TTL: z.string().default("1h"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("1h"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SAMESITE: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    z.enum(["none", "lax", "strict"]).optional(),
  ),
  COOKIE_SECURE: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    z.enum(["true", "false"]).optional().transform((value) => {
      if (value === undefined) return undefined;
      return value === "true";
    }),
  ),
  STORE_URL: z.string().url().optional(),
  ADMIN_URL: z.string().url().optional(),
  API_PUBLIC_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  CACHE_DEBUG: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().min(1).optional(),
  NEWSLETTER_TO: z.string().min(1).optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
  MP_PENDING_ORDER_TTL_MINUTES: z.coerce.number().int().positive().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean);

export const isProd = env.NODE_ENV === "production";

