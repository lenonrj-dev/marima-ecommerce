import { Router } from "express";
import { z } from "zod";
import {
  createCartShareHandler,
  getCartShareHandler,
  importCartShareHandler,
} from "../controllers/carts.controller";
import { optionalAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";

const router = Router();

router.post("/share", optionalAuth, createCartShareHandler);
router.get(
  "/shared/:token",
  validate({
    params: z.object({
      token: z.string().min(8),
    }),
  }),
  getCartShareHandler,
);
router.post(
  "/shared/:token/import",
  optionalAuth,
  validate({
    params: z.object({
      token: z.string().min(8),
    }),
  }),
  importCartShareHandler,
);

// Compatibilidade temporária
router.get(
  "/share/:token",
  validate({
    params: z.object({
      token: z.string().min(8),
    }),
  }),
  getCartShareHandler,
);
router.post(
  "/share/:token/import",
  optionalAuth,
  validate({
    params: z.object({
      token: z.string().min(8),
    }),
  }),
  importCartShareHandler,
);

export default router;
