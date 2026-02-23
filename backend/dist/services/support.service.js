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
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
const apiError_1 = require("../utils/apiError");
const pagination_1 = require("../utils/pagination");
function normalizeMessages(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((raw) => {
        if (!raw || typeof raw !== "object")
            return null;
        const row = raw;
        const message = String(row.message || "").trim();
        if (!message)
            return null;
        const createdAt = row.createdAt ? new Date(row.createdAt) : new Date();
        return {
            id: String(row.id || (0, crypto_1.randomUUID)()),
            authorType: row.authorType === "agent" ? "agent" : "customer",
            authorId: row.authorId ? String(row.authorId) : undefined,
            authorName: row.authorName ? String(row.authorName) : undefined,
            message,
            createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
        };
    })
        .filter((row) => row !== null);
}
function toTicket(ticket) {
    const messages = normalizeMessages(ticket.messages);
    return {
        id: String(ticket.id),
        code: ticket.code,
        subject: ticket.subject,
        customerName: ticket.customerName,
        email: ticket.email,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt?.toISOString(),
        messagesCount: messages.length,
    };
}
function toMessage(message) {
    return {
        id: String(message.id),
        authorType: message.authorType,
        authorId: message.authorId,
        authorName: message.authorName,
        message: message.message,
        createdAt: message.createdAt,
    };
}
async function generateTicketCode() {
    const count = await prisma_1.prisma.supportTicket.count();
    return `S-${String(2000 + count + 1)}`;
}
async function listTickets(input) {
    const where = {};
    if (input.q) {
        where.OR = [
            { code: { contains: input.q, mode: "insensitive" } },
            { subject: { contains: input.q, mode: "insensitive" } },
            { customerName: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
        ];
    }
    if (input.status && input.status !== "all")
        where.status = input.status;
    const [rows, total] = await Promise.all([
        prisma_1.prisma.supportTicket.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (input.page - 1) * input.limit,
            take: input.limit,
        }),
        prisma_1.prisma.supportTicket.count({ where }),
    ]);
    return {
        data: rows.map(toTicket),
        meta: (0, pagination_1.buildMeta)(total, input.page, input.limit),
    };
}
async function getTicketById(id) {
    const ticket = await prisma_1.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    const messages = normalizeMessages(ticket.messages);
    return {
        ...toTicket(ticket),
        messages: messages.map(toMessage),
    };
}
async function updateTicketStatus(id, status) {
    const ticket = await prisma_1.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    const updated = await prisma_1.prisma.supportTicket.update({
        where: { id },
        data: { status },
    });
    return toTicket(updated);
}
async function addTicketMessage(id, input) {
    const ticket = await prisma_1.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    const messages = normalizeMessages(ticket.messages);
    messages.push({
        id: (0, crypto_1.randomUUID)(),
        authorType: input.authorType,
        authorId: input.authorId,
        authorName: input.authorName,
        message: input.message.trim(),
        createdAt: new Date().toISOString(),
    });
    const updated = await prisma_1.prisma.supportTicket.update({
        where: { id },
        data: {
            messages: messages,
            ...(ticket.status === "resolvido" ? { status: "em_andamento" } : {}),
        },
    });
    return normalizeMessages(updated.messages).map(toMessage);
}
async function listTicketMessages(id) {
    const ticket = await prisma_1.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket)
        throw new apiError_1.ApiError(404, "Ticket n�o encontrado.");
    return normalizeMessages(ticket.messages).map(toMessage);
}
async function createStoreTicket(input) {
    const code = await generateTicketCode();
    const messages = input.message
        ? [
            {
                id: (0, crypto_1.randomUUID)(),
                authorType: "customer",
                authorName: input.customerName,
                authorId: input.customerId,
                message: input.message.trim(),
                createdAt: new Date().toISOString(),
            },
        ]
        : [];
    const created = await prisma_1.prisma.supportTicket.create({
        data: {
            code,
            subject: input.subject.trim(),
            customerName: input.customerName.trim(),
            email: input.email.trim().toLowerCase(),
            priority: input.priority || "media",
            status: "aberto",
            customerId: input.customerId,
            messages: messages,
        },
    });
    return toTicket(created);
}
