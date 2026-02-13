"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchAdminUserHandler = exports.inviteAdminUserHandler = exports.listAdminUsersHandler = void 0;
const AdminUser_1 = require("../models/AdminUser");
const notFound_1 = require("../middlewares/notFound");
const pagination_1 = require("../utils/pagination");
const auth_service_1 = require("../services/auth.service");
function toAdminUser(row) {
    return {
        id: String(row._id),
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
    const query = {};
    if (q) {
        query.$or = [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
        ];
    }
    if (role && role !== "all")
        query.role = role;
    const [rows, total] = await Promise.all([
        AdminUser_1.AdminUserModel.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        AdminUser_1.AdminUserModel.countDocuments(query),
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
    const user = await AdminUser_1.AdminUserModel.findById(String(req.params.id));
    if (!user) {
        res.status(404).json({ message: "Usuário não encontrado." });
        return;
    }
    if (req.body.name !== undefined)
        user.name = req.body.name;
    if (req.body.role !== undefined)
        user.role = req.body.role;
    if (req.body.active !== undefined)
        user.active = req.body.active;
    await user.save();
    res.json({ data: toAdminUser(user) });
});
