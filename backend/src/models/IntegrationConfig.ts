import { InferSchemaType, Schema, model, models } from "mongoose";

const integrationConfigSchema = new Schema(
  {
    group: {
      type: String,
      enum: ["pagamentos", "frete", "email", "whatsapp", "analytics", "pixel"],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    connected: { type: Boolean, default: false, index: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type IntegrationConfigDocument = InferSchemaType<typeof integrationConfigSchema>;

export const IntegrationConfigModel =
  models.IntegrationConfig || model("IntegrationConfig", integrationConfigSchema);
