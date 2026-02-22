import { createDocumentModel } from "../lib/documentModel";

export type SupportTicketDocument = {
  _id: string;
  code: string;
  customerId?: string;
  subject: string;
  customerName: string;
  email: string;
  status?: "aberto" | "em_andamento" | "resolvido";
  priority?: "baixa" | "media" | "alta";
  messages?: Array<{
    _id?: string;
    authorType: "customer" | "agent";
    authorId?: string;
    authorName?: string;
    message: string;
    createdAt?: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export const SupportTicketModel = createDocumentModel("SupportTicket");
