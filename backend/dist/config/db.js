"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
exports.disconnectDb = disconnectDb;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
let connected = false;
async function connectDb() {
    if (connected)
        return;
    mongoose_1.default.set("strictQuery", true);
    await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    connected = true;
}
async function disconnectDb() {
    if (!connected)
        return;
    await mongoose_1.default.disconnect();
    connected = false;
}
