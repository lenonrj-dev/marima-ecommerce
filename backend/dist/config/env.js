"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProd = exports.corsOrigins = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const schema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    MONGODB_URI: zod_1.z.string().min(1),
    JWT_ACCESS_SECRET: zod_1.z.string().min(10),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10),
    CORS_ORIGINS: zod_1.z.string().default("http://localhost:3000,http://localhost:3001"),
    ACCESS_TOKEN_TTL: zod_1.z.string().default("15m"),
    REFRESH_TOKEN_TTL: zod_1.z.string().default("7d"),
    COOKIE_DOMAIN: zod_1.z.string().optional(),
    STORE_URL: zod_1.z.string().url().optional(),
    ADMIN_URL: zod_1.z.string().url().optional(),
    API_PUBLIC_URL: zod_1.z.string().url().optional(),
    MERCADO_PAGO_ACCESS_TOKEN: zod_1.z.string().min(1).optional(),
    MERCADO_PAGO_WEBHOOK_SECRET: zod_1.z.string().min(1).optional(),
    MP_PENDING_ORDER_TTL_MINUTES: zod_1.z.coerce.number().int().positive().optional(),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
}
exports.env = parsed.data;
exports.corsOrigins = exports.env.CORS_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean);
exports.isProd = exports.env.NODE_ENV === "production";
