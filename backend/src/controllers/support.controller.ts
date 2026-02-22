import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import {
  addTicketMessage,
  createStoreTicket,
  getTicketById,
  listTicketMessages,
  listTickets,
  updateTicketStatus,
} from "../services/support.service";

export const listTicketsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

  const result = await listTickets({
    page,
    limit,
    q: String(req.query.q || "").trim() || undefined,
    status: String(req.query.status || "").trim() || undefined,
  });

  res.json(result);
});

export const getTicketByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getTicketById(String(req.params.id));
  res.json({ data });
});

export const patchTicketStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateTicketStatus(String(req.params.id), req.body.status);
  res.json({ data });
});

export const addTicketMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await addTicketMessage(String(req.params.id), req.body);
  res.status(201).json({ data });
});

export const listTicketMessagesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listTicketMessages(String(req.params.id));
  res.json({ data });
});

export const createStoreTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await createStoreTicket({
    subject: req.body.subject,
    customerName: req.body.customerName,
    email: req.body.email,
    priority: req.body.priority,
    message: req.body.message,
    customerId: req.auth?.type === "customer" ? req.auth.sub : undefined,
  });

  res.status(201).json({ data });
});

