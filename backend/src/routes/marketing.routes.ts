import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { subscribeNewsletterHandler } from "../controllers/marketing.controller";
import { validate } from "../middlewares/validate";

const router = Router();

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

router.post(
  "/newsletter/subscribe",
  newsletterLimiter,
  validate({
    body: z.object({
      email: z.string().trim().email("Digite um e-mail valido."),
      source: z.enum(["blog", "newsletter", "footer", "unknown"]).optional(),
    }),
  }),
  subscribeNewsletterHandler,
);

export default router;
