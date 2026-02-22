"use client";

import { useCallback, useState } from "react";
import {
  getNewsletterErrorMessage,
  subscribeNewsletter,
  type NewsletterSource,
} from "@/lib/newsletter";

type NewsletterFeedback = {
  type: "success" | "info" | "error";
  message: string;
};

export function useNewsletterSubscribe(source: NewsletterSource) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<NewsletterFeedback | null>(null);

  const submit = useCallback(
    async (email: string) => {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        setFeedback({ type: "error", message: "Digite um e-mail valido." });
        return false;
      }

      setIsSubmitting(true);
      setFeedback(null);

      try {
        const result = await subscribeNewsletter(normalizedEmail, source);
        if (result.status === "already_subscribed") {
          setFeedback({
            type: "info",
            message: "Voce ja esta cadastrado para receber novidades.",
          });
        } else if (result.warning) {
          setFeedback({
            type: "info",
            message: result.warning,
          });
        } else {
          setFeedback({
            type: "success",
            message: "E-mail cadastrado com sucesso.",
          });
        }

        return true;
      } catch (error) {
        setFeedback({
          type: "error",
          message: getNewsletterErrorMessage(error),
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [source],
  );

  return {
    isSubmitting,
    feedback,
    submit,
    clearFeedback: () => setFeedback(null),
  };
}
