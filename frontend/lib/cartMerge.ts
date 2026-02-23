import { apiFetch, HttpError } from "@/lib/api";
import { clearGuestCart, readGuestCart } from "@/lib/cartStorage";

type ApiCart = {
  couponCode?: string;
  items?: Array<{
    productId: string;
    variant?: string;
    sizeLabel?: string;
  }>;
};

function normalize(value: string | undefined) {
  return String(value || "").trim().toLowerCase();
}

function toKey(value: { productId: string; variant?: string; sizeLabel?: string }) {
  return [value.productId, normalize(value.variant), normalize(value.sizeLabel)].join("::");
}

export async function mergeGuestCartAfterAuth() {
  const snapshot = readGuestCart();
  if (!snapshot || snapshot.items.length === 0) return;

  let currentCart: ApiCart;
  try {
    const response = await apiFetch<{ data: ApiCart }>("/api/v1/me/cart", {
      skipAuthRedirect: true,
    });
    currentCart = response.data || {};
  } catch {
    // Keep snapshot for retry on next hydration.
    return;
  }

  const remoteKeys = new Set((currentCart.items || []).map((item) => toKey(item)));
  let shouldKeepSnapshot = false;

  for (const item of snapshot.items) {
    if (remoteKeys.has(toKey({ productId: item.productId, variant: item.variantId, sizeLabel: item.sizeLabel }))) {
      continue;
    }

    try {
      await apiFetch("/api/v1/me/cart/items", {
        method: "PUT",
        body: JSON.stringify({
          productId: item.productId,
          qty: item.qty,
          variant: item.variantId,
          sizeLabel: item.sizeLabel,
        }),
        skipAuthRedirect: true,
      });
    } catch (error) {
      if (!(error instanceof HttpError)) {
        shouldKeepSnapshot = true;
      }
    }
  }

  if (snapshot.couponCode && !currentCart.couponCode) {
    try {
      await apiFetch("/api/v1/me/cart/apply-coupon", {
        method: "POST",
        body: JSON.stringify({ code: snapshot.couponCode }),
        skipAuthRedirect: true,
      });
    } catch {
      // Coupon may be invalid or unavailable; keep checkout flow.
    }
  }

  if (!shouldKeepSnapshot) {
    clearGuestCart();
  }
}

