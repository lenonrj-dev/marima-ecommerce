import { InferSchemaType, Schema, Types, model, models } from "mongoose";

const supportMessageSchema = new Schema(
  {
    authorType: { type: String, enum: ["customer", "agent"], required: true },
    authorId: { type: Types.ObjectId },
    authorName: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const supportTicketSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    customerId: { type: Types.ObjectId, ref: "Customer", index: true },
    subject: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["aberto", "em_andamento", "resolvido"],
      default: "aberto",
      index: true,
    },
    priority: { type: String, enum: ["baixa", "media", "alta"], default: "media", index: true },
    messages: { type: [supportMessageSchema], default: [] },
  },
  { timestamps: true },
);

supportTicketSchema.index({ createdAt: -1, status: 1 });

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema>;

export const SupportTicketModel = models.SupportTicket || model("SupportTicket", supportTicketSchema);
