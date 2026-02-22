"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFound_1 = require("./middlewares/notFound");
const health_1 = require("./lib/health");
exports.app = (0, express_1.default)();
exports.app.set("trust proxy", 1);
const corsOriginsSet = new Set(env_1.corsOrigins.map((item) => item.replace(/\/$/, "")));
const corsConfig = {
    origin(origin, callback) {
        if (!origin)
            return callback(null, false);
        const normalized = origin.replace(/\/$/, "");
        const allowed = corsOriginsSet.has(normalized);
        if (!env_1.isProd) {
            console.log(`[CORS] ${allowed ? "ALLOW" : "BLOCK"} origin=${normalized}`);
        }
        callback(null, allowed ? normalized : false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    optionsSuccessStatus: 204,
};
exports.app.use((0, helmet_1.default)());
exports.app.use((0, morgan_1.default)("dev"));
exports.app.use((0, cors_1.default)(corsConfig));
exports.app.options("*", (0, cors_1.default)(corsConfig));
exports.app.use(express_1.default.json({ limit: "2mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.get("/health", async (_req, res) => {
    const health = await (0, health_1.runHealthChecks)();
    res.status(health.ok ? 200 : 503).json({
        status: health.ok ? "ok" : "degraded",
        checks: health.checks,
    });
});
exports.app.use("/api/v1", routes_1.default);
exports.app.use(notFound_1.notFound);
exports.app.use(errorHandler_1.errorHandler);
