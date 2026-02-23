"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchAdminUserHandler = exports.inviteAdminUserHandler = exports.listAdminUsersHandler = void 0;
const prisma_1 = require("../lib/prisma");
const notFound_1 = require("../middlewares/notFound");
const pagination_1 = require("../utils/pagination");
const auth_service_1 = require("../services/auth.service");
function toAdminUser(row) {
    return {
        id: String(row.id),
        name: row.name,
        email: row.email,
        role: row.role,
        active: row.active,
        tempPassword: row.tempPassword,
        createdAt: row.createdAt?.toISOString(),
        updatedAt: row.updatedAt?.toISOString(),
    };
}
exports.listAdminUsersHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "").trim();
    const where = {};
    if (q) {
        where.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
        ];
    }
    if (role && role !== "all")
        where.role = role;
    const [rows, total] = await Promise.all([
        prisma_1.prisma.adminUser.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.prisma.adminUser.count({ where }),
    ]);
    res.json({
        data: rows.map(toAdminUser),
        meta: (0, pagination_1.buildMeta)(total, page, limit),
    });
});
exports.inviteAdminUserHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const created = await (0, auth_service_1.inviteAdminUser)({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        temporaryPassword: req.body.temporaryPassword,
    });
    res.status(201).json({ data: toAdminUser(created) });
});
exports.patchAdminUserHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const id = String(req.params.id);
    const user = await prisma_1.prisma.adminUser.findUnique({ where: { id } });
    if (!user) {
        res.status(404).json({ message: "Usu�rio n�o encontrado." });
        return;
    }
    const updated = await prisma_1.prisma.adminUser.update({
        where: { id },
        data: {
            ...(req.body.name !== undefined ? { name: req.body.name } : {}),
            ...(req.body.role !== undefined ? { role: req.body.role } : {}),
            ...(req.body.active !== undefined ? { active: req.body.active } : {}),
        },
    });
    await (0, auth_service_1.invalidateMeCacheForUser)(updated.id);
    res.json({ data: toAdminUser(updated) });
});
