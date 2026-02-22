import { prisma } from "../lib/prisma";

let connected = false;

export async function connectDb() {
  if (connected) return;
  await prisma.$queryRaw`SELECT 1`;
  connected = true;
}

export async function disconnectDb() {
  if (!connected) return;
  await prisma.$disconnect();
  connected = false;
}
