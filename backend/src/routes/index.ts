import { Router } from "express";
import authRoutes from "./auth.routes";
import storeRoutes from "./store.routes";
import meRoutes from "./me.routes";
import adminRoutes from "./admin.routes";
import paymentsRoutes from "./payments.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ data: { ok: true, service: "backend", timestamp: new Date().toISOString() } });
});

router.use("/auth", authRoutes);
router.use("/payments", paymentsRoutes);
router.use("/store", storeRoutes);
router.use("/me", meRoutes);
router.use("/admin", adminRoutes);

export default router;
