import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const NEWSLETTER_SOURCES = ["blog", "newsletter", "footer", "unknown"] as const;

export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export type NewsletterSubscriberDTO = {
  id: string;
  email: string;
  source: NewsletterSource | null;
  createdAt: string;
  updatedAt: string;
};

export type SubscribeNewsletterInput = {
  email: string;
  source?: string;
};

export type SubscribeNewsletterResult = {
  status: "subscribed" | "already_subscribed";
  subscriber: NewsletterSubscriberDTO;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeSource(value: string | undefined): NewsletterSource {
  const parsed = String(value || "").trim().toLowerCase();
  if (NEWSLETTER_SOURCES.includes(parsed as NewsletterSource)) {
    return parsed as NewsletterSource;
  }
  return "unknown";
}

function toSubscriberDTO(input: {
  id: string;
  email: string;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}): NewsletterSubscriberDTO {
  return {
    id: input.id,
    email: input.email,
    source: (input.source as NewsletterSource | null) || null,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
  };
}

export async function subscribeNewsletter(
  input: SubscribeNewsletterInput,
): Promise<SubscribeNewsletterResult> {
  const email = normalizeEmail(input.email);
  const source = normalizeSource(input.source);

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existing) {
    return {
      status: "already_subscribed",
      subscriber: toSubscriberDTO(existing),
    };
  }

  try {
    const created = await prisma.newsletterSubscriber.create({
      data: {
        email,
        source,
      },
    });

    return {
      status: "subscribed",
      subscriber: toSubscriberDTO(created),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicated = await prisma.newsletterSubscriber.findUnique({
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
