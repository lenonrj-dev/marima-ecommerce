import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  loginAdminHandler,
  loginCustomerHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerCustomerHandler,
} from "../controllers/auth.controller";
import { optionalAuth, requireAuth } from "../middlewares/auth";
import { env } from "../config/env";
import { getToken } from "../lib/auth";
import { validate } from "../middlewares/validate";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente em alguns minutos." },
});

router.post(
  "/customer/register",
  authLimiter,
  validate({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
    }),
  }),
  registerCustomerHandler,
);

router.post(
  "/customer/login",
  authLimiter,
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  }),
  loginCustomerHandler,
);

router.post(
  "/admin/login",
  authLimiter,
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  }),
  loginAdminHandler,
);

router.post("/logout", logoutHandler);
router.post("/refresh", refreshHandler);
router.get("/me", requireAuth, meHandler);
router.get("/debug", optionalAuth, (req, res) => {
  if (env.NODE_ENV === "production") {
    res.status(404).json({ message: "Not found" });
    return;
  }

  const token = getToken(req);
  const cookieNames = Object.keys(req.cookies || {});
  res.json({
    data: {
      hasToken: Boolean(token),
      authType: req.auth?.type || null,
      authRole: req.auth?.role || null,
      hasAccessCookie: cookieNames.includes("access_token") || cookieNames.includes("marima_access"),
      cookies: cookieNames,
    },
  });
});

export default router;
