import { Router } from "express";
import authRoutes from "./auth.routes";
import storeRoutes from "./store.routes";
import meRoutes from "./me.routes";
import adminRoutes from "./admin.routes";
import paymentsRoutes from "./payments.routes";
import postsRoutes from "./posts.routes";
import cartRoutes from "./cart.routes";
import marketingRoutes from "./marketing.routes";
import { env } from "../config/env";
import { runHealthChecks } from "../lib/health";

const router = Router();

router.get("/health", async (_req, res) => {
  const health = await runHealthChecks();
  res.status(health.ok ? 200 : 503).json({
    data: {
      ok: health.ok,
      service: "backend",
      env: env.NODE_ENV,
      uptime: process.uptime(),
      port: Number(process.env.RUNTIME_PORT || env.PORT),
      timestamp: new Date().toISOString(),
      checks: health.checks,
    },
  });
});

router.use("/auth", authRoutes);
router.use("/payments", paymentsRoutes);
router.use("/store", storeRoutes);
router.use("/blog", postsRoutes);
router.use("/marketing", marketingRoutes);
router.use("/me", meRoutes);
router.use("/cart", cartRoutes);
router.use("/admin", adminRoutes);

export default router;
