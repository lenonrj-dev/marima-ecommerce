"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBlogPostBySlug = findBlogPostBySlug;
exports.listTopLevelCommentsByPostId = listTopLevelCommentsByPostId;
exports.findCommentById = findCommentById;
exports.createComment = createComment;
exports.patchCommentStatusById = patchCommentStatusById;
const prisma_1 = require("../../../lib/prisma");
async function findBlogPostBySlug(slug) {
    return prisma_1.prisma.post.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            published: true,
            title: true,
        },
    });
}
async function listTopLevelCommentsByPostId(input) {
    const where = {
        postId: input.postId,
        parentId: null,
    };
    if (input.status) {
        where.status = input.status;
    }
    return prisma_1.prisma.blogComment.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
            customer: {
                select: { id: true, name: true },
            },
            replies: {
                where: input.status ? { status: input.status } : undefined,
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
                include: {
                    customer: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });
}
async function findCommentById(id) {
    return prisma_1.prisma.blogComment.findUnique({
        where: { id },
        select: {
            id: true,
            postId: true,
            parentId: true,
            customerId: true,
            status: true,
        },
    });
}
async function createComment(input) {
    return prisma_1.prisma.blogComment.create({
        data: {
            postId: input.postId,
            customerId: input.customerId,
            content: input.content,
            parentId: input.parentId || null,
            status: "published",
        },
        include: {
            customer: {
                select: { id: true, name: true },
            },
            replies: {
                include: {
                    customer: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });
}
async function patchCommentStatusById(id, status) {
    return prisma_1.prisma.blogComment.update({
        where: { id },
        data: { status },
        include: {
            customer: {
                select: { id: true, name: true },
            },
            replies: {
                include: {
                    customer: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });
}
