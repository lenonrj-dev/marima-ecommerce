import mongoose from "mongoose";
import { env } from "./env";

let connected = false;

export async function connectDb() {
  if (connected) return;

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  connected = true;
}

export async function disconnectDb() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
