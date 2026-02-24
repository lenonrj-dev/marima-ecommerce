"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeNewsletterHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const mailer_1 = require("../services/mailer");
const newsletter_service_1 = require("../services/newsletter.service");
function getRequestIp(req) {
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
exports.subscribeNewsletterHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const result = await (0, newsletter_service_1.subscribeNewsletter)({
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
    const mailResult = await (0, mailer_1.sendNewsletterLeadEmail)({
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
