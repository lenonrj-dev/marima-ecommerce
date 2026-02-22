import { createDocumentModel } from "../lib/documentModel";

export type IntegrationConfigDocument = {
  _id: string;
  group: "pagamentos" | "frete" | "email" | "whatsapp" | "analytics" | "pixel";
  name: string;
  description: string;
  connected?: boolean;
  config?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
};

export const IntegrationConfigModel = createDocumentModel("IntegrationConfig");
