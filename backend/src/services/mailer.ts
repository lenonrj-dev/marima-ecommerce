import nodemailer from "nodemailer";
import { env } from "../config/env";

export type NewsletterLeadMeta = {
  subscribedAtIso?: string;
  ip?: string;
  userAgent?: string;
};

export type SendNewsletterLeadEmailInput = {
  email: string;
  source: string;
  meta?: NewsletterLeadMeta;
};

export type SendNewsletterLeadEmailResult = {
  ok: boolean;
  reason?: "MAIL_CONFIG_MISSING" | "MAIL_SEND_FAILED";
  messageId?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendNewsletterLeadEmail(
  input: SendNewsletterLeadEmailInput,
): Promise<SendNewsletterLeadEmailResult> {
  const to = env.NEWSLETTER_TO || env.GMAIL_USER;
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD || !to) {
    console.warn("[newsletter] Config de e-mail ausente. Notificacao por e-mail nao enviada.");
    return { ok: false, reason: "MAIL_CONFIG_MISSING" };
  }

  const subscribedAtIso = input.meta?.subscribedAtIso || new Date().toISOString();
  const ip = input.meta?.ip || "nao informado";
  const userAgent = input.meta?.userAgent || "nao informado";

  const subject = `[Marima Newsletter] Nova inscricao (${input.source})`;
  const text = [
    "Nova inscricao na newsletter da Marima.",
    "",
    `E-mail: ${input.email}`,
    `Origem: ${input.source}`,
    `Data/Hora: ${subscribedAtIso}`,
    `IP: ${ip}`,
    `User-Agent: ${userAgent}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px 0">Nova inscricao na newsletter</h2>
      <p style="margin:0 0 8px 0"><strong>E-mail:</strong> ${input.email}</p>
      <p style="margin:0 0 8px 0"><strong>Origem:</strong> ${input.source}</p>
      <p style="margin:0 0 8px 0"><strong>Data/Hora:</strong> ${subscribedAtIso}</p>
      <p style="margin:0 0 8px 0"><strong>IP:</strong> ${ip}</p>
      <p style="margin:0"><strong>User-Agent:</strong> ${userAgent}</p>
    </div>
  `;

  try {
    const info = await getTransporter().sendMail({
      from: env.GMAIL_USER,
      to,
      replyTo: input.email,
      subject,
      text,
      html,
    });

    console.info(`[newsletter] E-mail enviado com sucesso. source=${input.source} to=${to}`);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[newsletter] Falha ao enviar e-mail. source=${input.source}`, error);
    return { ok: false, reason: "MAIL_SEND_FAILED" };
  }
}
