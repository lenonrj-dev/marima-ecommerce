import { InferSchemaType, Schema, Types, model, models } from "mongoose";

const customerAddressSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: "Customer", required: true, index: true },
    label: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true },
    complement: { type: String, trim: true },
    isDefault: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export type CustomerAddressDocument = InferSchemaType<typeof customerAddressSchema>;

export const CustomerAddressModel =
  models.CustomerAddress || model("CustomerAddress", customerAddressSchema);
