"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewsletterLeadEmail = sendNewsletterLeadEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: env_1.env.GMAIL_USER,
                pass: env_1.env.GMAIL_APP_PASSWORD,
            },
        });
    }
    return transporter;
}
async function sendNewsletterLeadEmail(input) {
    const to = env_1.env.NEWSLETTER_TO || env_1.env.GMAIL_USER;
    if (!env_1.env.GMAIL_USER || !env_1.env.GMAIL_APP_PASSWORD || !to) {
        console.warn("[newsletter] Configuração de e-mail ausente. Notificação por e-mail não enviada.");
        return { ok: false, reason: "MAIL_CONFIG_MISSING" };
    }
    const subscribedAtIso = input.meta?.subscribedAtIso || new Date().toISOString();
    const ip = input.meta?.ip || "não informado";
    const userAgent = input.meta?.userAgent || "não informado";
    const subject = `[Marima Newsletter] Nova inscrição (${input.source})`;
    const text = [
        "Nova inscrição na newsletter da Marima.",
        "",
        `E-mail: ${input.email}`,
        `Origem: ${input.source}`,
        `Data/Hora: ${subscribedAtIso}`,
        `IP: ${ip}`,
        `User-Agent: ${userAgent}`,
    ].join("\n");
    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px 0">Nova inscrição na newsletter</h2>
      <p style="margin:0 0 8px 0"><strong>E-mail:</strong> ${input.email}</p>
      <p style="margin:0 0 8px 0"><strong>Origem:</strong> ${input.source}</p>
      <p style="margin:0 0 8px 0"><strong>Data/Hora:</strong> ${subscribedAtIso}</p>
      <p style="margin:0 0 8px 0"><strong>IP:</strong> ${ip}</p>
      <p style="margin:0"><strong>User-Agent:</strong> ${userAgent}</p>
    </div>
  `;
    try {
        const info = await getTransporter().sendMail({
            from: env_1.env.GMAIL_USER,
            to,
            replyTo: input.email,
            subject,
            text,
            html,
        });
        console.info(`[newsletter] E-mail enviado com sucesso. source=${input.source} to=${to}`);
        return { ok: true, messageId: info.messageId };
    }
    catch (error) {
        console.error(`[newsletter] Falha ao enviar e-mail. source=${input.source}`, error);
        return { ok: false, reason: "MAIL_SEND_FAILED" };
    }
}
