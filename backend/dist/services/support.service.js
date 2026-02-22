"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTickets = listTickets;
exports.getTicketById = getTicketById;
exports.updateTicketStatus = updateTicketStatus;
exports.addTicketMessage = addTicketMessage;
exports.listTicketMessages = listTicketMessages;
exports.createStoreTicket = createStoreTicket;
exports.toTicket = toTicket;
exports.toMessage = toMessage;
const SupportTicket_1 = require("../models/SupportTicket");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
function toTicket(ticket) {
    return {
        id: String(ticket._id),
        code: ticket.code,
        subject: ticket.subject,
        customerName: ticket.customerName,
        email: ticket.email,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt?.toISOString(),
        messagesCount: ticket.messages?.length || 0,
    };
}
function toMessage(message) {
    return {
        id: String(message._id),
        authorType: message.authorType,
        authorId: message.authorId ? String(message.authorId) : undefined,
        authorName: message.authorName,
        message: message.message,
        createdAt: message.createdAt?.toISOString(),
    };
}
async function generateTicketCode() {
    const count = await SupportTicket_1.SupportTicketModel.countDocuments();
    return `S-${String(2000 + count + 1)}`;
}
async function listTickets(input) {
    const query = {};
    if (input.q) {
        query.$or = [
            { code: { $regex: input.q, $options: "i" } },
            { subject: { $regex: input.q, $options: "i" } },
            { customerName: { $regex: input.q, $options: "i" } },
            { email: { $regex: input.q, $options: "i" } },
        ];
    }
    if (input.status && input.status !== "all")
        query.status = input.status;
    const [rows, total] = await Promise.all([
        SupportTicket_1.SupportTicketModel.find(query)
            .sort({ createdAt: -1 })
            .skip((input.page - 1) * input.limit)
            .limit(input.limit),
        SupportTicket_1.SupportTicketModel.countDocuments(query),
    ]);
    return {
        data: rows.map(toTicket),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getTicketById(id) {
    const ticket = await SupportTicket_1.SupportTicketModel.findById(id);
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    return {
        ...toTicket(ticket),
        messages: (ticket.messages || []).map(toMessage),
    };
}
async function updateTicketStatus(id, status) {
    const ticket = await SupportTicket_1.SupportTicketModel.findById(id);
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    ticket.status = status;
    await ticket.save();
    return toTicket(ticket);
}
async function addTicketMessage(id, input) {
    const ticket = await SupportTicket_1.SupportTicketModel.findById(id);
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    ticket.messages.push({
        authorType: input.authorType,
        authorId: input.authorId,
        authorName: input.authorName,
        message: input.message.trim(),
        createdAt: new Date(),
    });
    if (ticket.status === "resolvido")
        ticket.status = "em_andamento";
    await ticket.save();
    return (ticket.messages || []).map(toMessage);
}
async function listTicketMessages(id) {
    const ticket = await SupportTicket_1.SupportTicketModel.findById(id);
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    return (ticket.messages || []).map(toMessage);
}
async function createStoreTicket(input) {
    const code = await generateTicketCode();
    const created = await SupportTicket_1.SupportTicketModel.create({
        code,
        subject: input.subject.trim(),
        customerName: input.customerName.trim(),
        email: input.email.trim().toLowerCase(),
        priority: input.priority || "media",
        status: "aberto",
        customerId: input.customerId,
        messages: input.message
            ? [
                {
                    authorType: "customer",
                    authorName: input.customerName,
                    authorId: input.customerId,
                    message: input.message.trim(),
                },
            ]
            : [],
    });
    return toTicket(created);
}
