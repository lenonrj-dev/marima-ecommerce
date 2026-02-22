"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const marketing_controller_1 = require("../controllers/marketing.controller");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
const newsletterLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
});
router.post("/newsletter/subscribe", newsletterLimiter, (0, validate_1.validate)({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().email("Digite um e-mail valido."),
        source: zod_1.z.enum(["blog", "newsletter", "footer", "unknown"]).optional(),
    }),
}), marketing_controller_1.subscribeNewsletterHandler);
exports.default = router;
