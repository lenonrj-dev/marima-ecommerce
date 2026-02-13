import { Router } from "express";
import authRoutes from "./auth.routes";
import storeRoutes from "./store.routes";
import meRoutes from "./me.routes";
import adminRoutes from "./admin.routes";
import paymentsRoutes from "./payments.routes";
import { env } from "../config/env";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    data: {
      ok: true,
      service: "backend",
      env: env.NODE_ENV,
      uptime: process.uptime(),
      port: Number(process.env.RUNTIME_PORT || env.PORT),
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/payments", paymentsRoutes);
router.use("/store", storeRoutes);
router.use("/me", meRoutes);
router.use("/admin", adminRoutes);

export default router;
