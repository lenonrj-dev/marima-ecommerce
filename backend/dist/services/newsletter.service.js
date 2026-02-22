"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeNewsletter = subscribeNewsletter;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const NEWSLETTER_SOURCES = ["blog", "newsletter", "footer", "unknown"];
function normalizeEmail(value) {
    return value.trim().toLowerCase();
}
function normalizeSource(value) {
    const parsed = String(value || "").trim().toLowerCase();
    if (NEWSLETTER_SOURCES.includes(parsed)) {
        return parsed;
    }
    return "unknown";
}
function toSubscriberDTO(input) {
    return {
        id: input.id,
        email: input.email,
        source: input.source || null,
        createdAt: input.createdAt.toISOString(),
        updatedAt: input.updatedAt.toISOString(),
    };
}
async function subscribeNewsletter(input) {
    const email = normalizeEmail(input.email);
    const source = normalizeSource(input.source);
    const existing = await prisma_1.prisma.newsletterSubscriber.findUnique({
        where: { email },
    });
    if (existing) {
        return {
            status: "already_subscribed",
            subscriber: toSubscriberDTO(existing),
        };
    }
    try {
        const created = await prisma_1.prisma.newsletterSubscriber.create({
            data: {
                email,
                source,
            },
        });
        return {
            status: "subscribed",
            subscriber: toSubscriberDTO(created),
        };
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const duplicated = await prisma_1.prisma.newsletterSubscriber.findUnique({
                where: { email },
            });
            if (duplicated) {
                return {
                    status: "already_subscribed",
                    subscriber: toSubscriberDTO(duplicated),
                };
            }
        }
        throw error;
    }
}
