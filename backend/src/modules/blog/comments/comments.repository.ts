import { CommentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

export type BlogPostLookup = {
  id: string;
  slug: string;
  published: boolean;
  title: string;
};

export type BlogCommentWithRelations = Prisma.BlogCommentGetPayload<{
  include: {
    customer: { select: { id: true; name: true } };
    replies: {
      include: {
        customer: { select: { id: true; name: true } };
      };
    };
  };
}>;

export async function findBlogPostBySlug(slug: string) {
  return prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      published: true,
      title: true,
    },
  }) as Promise<BlogPostLookup | null>;
}

export async function listTopLevelCommentsByPostId(input: {
  postId: string;
  status?: CommentStatus;
  limit: number;
  cursor?: string;
}) {
  const where: Prisma.BlogCommentWhereInput = {
    postId: input.postId,
    parentId: null,
  };

  if (input.status) {
    where.status = input.status;
  }

  return prisma.blogComment.findMany({
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

export async function findCommentById(id: string) {
  return prisma.blogComment.findUnique({
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

export async function createComment(input: {
  postId: string;
  customerId: string;
  content: string;
  parentId?: string;
}) {
  return prisma.blogComment.create({
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

export async function patchCommentStatusById(id: string, status: CommentStatus) {
  return prisma.blogComment.update({
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
