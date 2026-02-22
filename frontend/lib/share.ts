export type ShareResult = {
  ok: boolean;
  mode: "native" | "copy";
};

function fallbackCopy(text: string) {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}

export function getCurrentUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export async function copyLink(url?: string) {
  const targetUrl = (url || getCurrentUrl()).trim();
  if (!targetUrl) return { ok: false };

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(targetUrl);
      return { ok: true };
    } catch {
      // Fallback below.
    }
  }

  return { ok: fallbackCopy(targetUrl) };
}

export async function shareLink(input?: { title?: string; text?: string; url?: string }): Promise<ShareResult> {
  const url = (input?.url || getCurrentUrl()).trim();
  if (!url) return { ok: false, mode: "copy" };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: input?.title || (typeof document !== "undefined" ? document.title : ""),
        text: input?.text || "",
        url,
      });
      return { ok: true, mode: "native" };
    } catch {
      // Fallback to copy below.
    }
  }

  const copied = await copyLink(url);
  return { ok: copied.ok, mode: "copy" };
}
