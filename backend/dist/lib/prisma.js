"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
function createClient() {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}
exports.prisma = global.__marimaPrisma__ || createClient();
if (process.env.NODE_ENV !== "production") {
    global.__marimaPrisma__ = exports.prisma;
}
