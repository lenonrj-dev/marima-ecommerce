import { FilterQuery } from "../lib/dbCompat";
import { SupportTicketModel } from "../models/SupportTicket";
import { ApiError } from "../utils/apiError";
import { buildMeta } from "../utils/pagination";

function toTicket(ticket: any) {
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

function toMessage(message: any) {
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
  const count = await SupportTicketModel.countDocuments();
  return `S-${String(2000 + count + 1)}`;
}

export async function listTickets(input: { page: number; limit: number; q?: string; status?: string }) {
  const query: FilterQuery<any> = {};

  if (input.q) {
    query.$or = [
      { code: { $regex: input.q, $options: "i" } },
      { subject: { $regex: input.q, $options: "i" } },
      { customerName: { $regex: input.q, $options: "i" } },
      { email: { $regex: input.q, $options: "i" } },
    ];
  }

  if (input.status && input.status !== "all") query.status = input.status;

  const [rows, total] = await Promise.all([
    SupportTicketModel.find(query)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    SupportTicketModel.countDocuments(query),
  ]);

  return {
    data: rows.map(toTicket),
    meta: buildMeta(total, input.page, input.limit),
  };
}

export async function getTicketById(id: string) {
  const ticket = await SupportTicketModel.findById(id);
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  return {
    ...toTicket(ticket),
    messages: (ticket.messages || []).map(toMessage),
  };
}

export async function updateTicketStatus(id: string, status: "aberto" | "em_andamento" | "resolvido") {
  const ticket = await SupportTicketModel.findById(id);
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  ticket.status = status;
  await ticket.save();

  return toTicket(ticket);
}

export async function addTicketMessage(
  id: string,
  input: { authorType: "customer" | "agent"; authorName?: string; message: string; authorId?: string },
) {
  const ticket = await SupportTicketModel.findById(id);
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  ticket.messages.push({
    authorType: input.authorType,
    authorId: input.authorId as any,
    authorName: input.authorName,
    message: input.message.trim(),
    createdAt: new Date(),
  });

  if (ticket.status === "resolvido") ticket.status = "em_andamento";

  await ticket.save();

  return (ticket.messages || []).map(toMessage);
}

export async function listTicketMessages(id: string) {
  const ticket = await SupportTicketModel.findById(id);
  if (!ticket) throw new ApiError(404, "Ticket não encontrado.");

  return (ticket.messages || []).map(toMessage);
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
  const created = await SupportTicketModel.create({
    code,
    subject: input.subject.trim(),
    customerName: input.customerName.trim(),
    email: input.email.trim().toLowerCase(),
    priority: input.priority || "media",
    status: "aberto",
    customerId: input.customerId as any,
    messages: input.message
      ? [
          {
            authorType: "customer",
            authorName: input.customerName,
            authorId: input.customerId as any,
            message: input.message.trim(),
          },
        ]
      : [],
  });

  return toTicket(created);
}

export { toTicket, toMessage };

