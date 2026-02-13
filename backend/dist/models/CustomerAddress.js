"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAddressModel = void 0;
const mongoose_1 = require("mongoose");
const customerAddressSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Types.ObjectId, ref: "Customer", required: true, index: true },
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
}, { timestamps: true });
exports.CustomerAddressModel = mongoose_1.models.CustomerAddress || (0, mongoose_1.model)("CustomerAddress", customerAddressSchema);
