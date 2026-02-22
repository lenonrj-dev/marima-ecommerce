"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
exports.disconnectDb = disconnectDb;
const prisma_1 = require("../lib/prisma");
let connected = false;
async function connectDb() {
    if (connected)
        return;
    await prisma_1.prisma.$queryRaw `SELECT 1`;
    connected = true;
}
async function disconnectDb() {
    if (!connected)
        return;
    await prisma_1.prisma.$disconnect();
    connected = false;
}
