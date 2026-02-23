import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";

type TicketMessage = {
  id: string;
  authorType: "customer" | "agent";
  authorId?: string;
  authorName?: string;
  message: string;
  createdAt: string;
};

function normalizeMessages(value: unknown): TicketMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as any;
      const message = String(row.message || "").trim();
      if (!message) return null;
      const createdAt = row.createdAt ? new Date(row.createdAt) : new Date();
      return {
        id: String(row.id || randomUUID()),
        authorType: row.authorType === "agent" ? "agent" : "customer",
        authorId: row.authorId ? String(row.authorId) : undefined,
        authorName: row.authorName ? String(row.authorName) : undefined,
        message,
        createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
      } as TicketMessage;
    })
    .filter((row): row is TicketMessage => row !== null);
}

function toTicket(ticket: any) {
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

function toMessage(message: TicketMessage) {
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
  const count = await prisma.supportTicket.count();
  return `S-${String(2000 + count + 1)}`;
}

export async function listTickets(input: { page: number; limit: number; q?: string; status?: string }) {
  const where: any = {};

  if (input.q) {
    where.OR = [
      { code: { contains: input.q, mode: "insensitive" } },
      { subject: { contains: input.q, mode: "insensitive" } },
      { customerName: { contains: input.q, mode: "insensitive" } },
      { email: { contains: input.q, mode: "insensitive" } },
    ];
  }

  if (input.status && input.status !== "all") where.status = input.status;

  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    data: rows.map(toTicket),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getTicketById(id: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  const messages = normalizeMessages(ticket.messages);

  return {
    ...toTicket(ticket),
    messages: messages.map(toMessage),
  };
}

export async function updateTicketStatus(id: string, status: "aberto" | "em_andamento" | "resolvido") {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status },
  });

  return toTicket(updated);
}

export async function addTicketMessage(
  id: string,
  input: { authorType: "customer" | "agent"; authorName?: string; message: string; authorId?: string },
) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  const messages = normalizeMessages(ticket.messages);
  messages.push({
    id: randomUUID(),
    authorType: input.authorType,
    authorId: input.authorId,
    authorName: input.authorName,
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  });

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      messages: messages as any,
      ...(ticket.status === "resolvido" ? { status: "em_andamento" } : {}),
    },
  });

  return normalizeMessages(updated.messages).map(toMessage);
}

export async function listTicketMessages(id: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  return normalizeMessages(ticket.messages).map(toMessage);
}

export async function createStoreTicket(input: {
  subject: string;
  customerName: string;
  email: string;
  priority?: "baixa" | "media" | "alta";
  message?: string;
  customerId?: string;
}) {
  const code = await generateTicketCode();

  const messages: TicketMessage[] = input.message
    ? [
        {
          id: randomUUID(),
          authorType: "customer",
          authorName: input.customerName,
          authorId: input.customerId,
          message: input.message.trim(),
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  const created = await prisma.supportTicket.create({
    data: {
      code,
      subject: input.subject.trim(),
      customerName: input.customerName.trim(),
      email: input.email.trim().toLowerCase(),
      priority: input.priority || "media",
      status: "aberto",
      customerId: input.customerId,
      messages: messages as any,
    },
  });

  return toTicket(created);
}

export { toTicket, toMessage };
