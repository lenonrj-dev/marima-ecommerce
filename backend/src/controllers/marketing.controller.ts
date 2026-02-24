import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/notFound";
import { sendNewsletterLeadEmail } from "../services/mailer";
import { subscribeNewsletter } from "../services/newsletter.service";

function getRequestIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const [firstIp] = forwarded.split(",");
    return (firstIp || "").trim() || req.ip || "não informado";
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0] || "").trim() || req.ip || "não informado";
  }

  return req.ip || "não informado";
}

export const subscribeNewsletterHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscribeNewsletter({
    email: String(req.body?.email || ""),
    source: req.body?.source,
  });

  if (result.status === "already_subscribed") {
    res.status(200).json({
      data: {
        ok: true,
        status: "already_subscribed",
        message: "Você já está inscrito na newsletter.",
      },
    });
    return;
  }

  const mailResult = await sendNewsletterLeadEmail({
    email: result.subscriber.email,
    source: result.subscriber.source || "unknown",
    meta: {
      subscribedAtIso: result.subscriber.createdAt,
      ip: getRequestIp(req),
      userAgent: String(req.headers["user-agent"] || ""),
    },
  });

  if (!mailResult.ok) {
    res.status(201).json({
      data: {
        ok: true,
        status: "subscribed",
        message: "Inscrição realizada com sucesso.",
        warning: "Inscrição salva, mas não foi possível enviar a notificação por e-mail agora.",
      },
    });
    return;
  }

  res.status(201).json({
    data: {
      ok: true,
      status: "subscribed",
      message: "Inscrição realizada com sucesso.",
    },
  });
});
