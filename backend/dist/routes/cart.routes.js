"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const carts_controller_1 = require("../controllers/carts.controller");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const router = (0, express_1.Router)();
router.post("/share", auth_1.optionalAuth, carts_controller_1.createCartShareHandler);
router.get("/shared/:token", (0, validate_1.validate)({
    params: zod_1.z.object({
        token: zod_1.z.string().min(8),
    }),
}), carts_controller_1.getCartShareHandler);
router.post("/shared/:token/import", auth_1.optionalAuth, (0, validate_1.validate)({
    params: zod_1.z.object({
        token: zod_1.z.string().min(8),
    }),
}), carts_controller_1.importCartShareHandler);
// Compatibilidade temporária
router.get("/share/:token", (0, validate_1.validate)({
    params: zod_1.z.object({
        token: zod_1.z.string().min(8),
    }),
}), carts_controller_1.getCartShareHandler);
router.post("/share/:token/import", auth_1.optionalAuth, (0, validate_1.validate)({
    params: zod_1.z.object({
        token: zod_1.z.string().min(8),
    }),
}), carts_controller_1.importCartShareHandler);
exports.default = router;
