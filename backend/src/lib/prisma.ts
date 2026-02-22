import { PrismaClient } from "@prisma/client";

declare global {
  var __marimaPrisma__: PrismaClient | undefined;
}

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = global.__marimaPrisma__ || createClient();

if (process.env.NODE_ENV !== "production") {
  global.__marimaPrisma__ = prisma;
}
