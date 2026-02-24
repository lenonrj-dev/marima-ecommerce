import { HttpError, apiFetch } from "@/lib/api";

export type NewsletterSource = "blog" | "newsletter" | "footer";

export type NewsletterSubscribeResult = {
  status: "subscribed" | "already_subscribed";
  message: string;
  warning?: string;
};

type SubscribeNewsletterResponse = {
  data?: {
    status?: "subscribed" | "already_subscribed";
    message?: string;
    warning?: string;
  };
};

export async function subscribeNewsletter(
  email: string,
  source: NewsletterSource,
): Promise<NewsletterSubscribeResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const response = await apiFetch<SubscribeNewsletterResponse>("/api/v1/marketing/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      source,
    }),
    skipAuthRedirect: true,
  });

  const status = response?.data?.status || "subscribed";
  const message =
    response?.data?.message ||
    (status === "already_subscribed"
      ? "Você já está inscrito na newsletter."
      : "Inscrição realizada com sucesso.");

  return {
    status,
    message,
    warning: response?.data?.warning,
  };
}

export function getNewsletterErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 400) return "Digite um e-mail válido.";
    if (error.status === 429) return "Muitas tentativas. Tente novamente em alguns minutos.";
    if (typeof error.message === "string" && error.message.trim()) return error.message;
  }

  return "Não foi possível concluir sua inscrição agora. Tente novamente.";
}
