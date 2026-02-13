"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStoreTicketHandler = exports.listTicketMessagesHandler = exports.addTicketMessageHandler = exports.patchTicketStatusHandler = exports.getTicketByIdHandler = exports.listTicketsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const support_service_1 = require("../services/support.service");
exports.listTicketsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const result = await (0, support_service_1.listTickets)({
        page,
        limit,
        q: String(req.query.q || "").trim() || undefined,
        status: String(req.query.status || "").trim() || undefined,
    });
    res.json(result);
});
exports.getTicketByIdHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, support_service_1.getTicketById)(String(req.params.id));
    res.json({ data });
});
exports.patchTicketStatusHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, support_service_1.updateTicketStatus)(String(req.params.id), req.body.status);
    res.json({ data });
});
exports.addTicketMessageHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, support_service_1.addTicketMessage)(String(req.params.id), req.body);
    res.status(201).json({ data });
});
exports.listTicketMessagesHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, support_service_1.listTicketMessages)(String(req.params.id));
    res.json({ data });
});
exports.createStoreTicketHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, support_service_1.createStoreTicket)({
        subject: req.body.subject,
        customerName: req.body.customerName,
        email: req.body.email,
        priority: req.body.priority,
        message: req.body.message,
        customerId: req.auth?.type === "customer" ? req.auth.sub : undefined,
    });
    res.status(201).json({ data });
});
