"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/productsData";
import { apiFetch, HttpError, onAuthExpired } from "@/lib/api";
import {
  INITIAL_CART_STATE,
  type CartItem,
  type CartItemInput,
  type CartTotals,
  cartReducer,
  calculateCartTotals,
  toCartItemInput,
} from "@/lib/store/cart";
import {
  INITIAL_FAVORITES_STATE,
  type FavoriteItem,
  favoritesReducer,
  toFavoriteItem,
} from "@/lib/store/favorites";

type CheckoutDraft = {
  zip: string;
  city: string;
  address: string;
  lgpdConsent: boolean;
  paymentMethod: "card" | "pix" | "boleto" | "installments";
  cardName: string;
  installments: string;
};

type CartContextValue = {
  isHydrated: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;

  cartId: string | null;
  items: CartItem[];
  itemCount: number;
  totals: CartTotals;
  coupon: string | null;
  isQuoting: boolean;
  error: string | null;
  setError: (value: string | null) => void;

  addItem: (input: CartItemInput) => void;
  addProduct: (product: Product, options?: { qty?: number; variant?: string; sizeLabel?: string }) => void;
  removeItem: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  clear: () => void;

  applyCoupon: (code: string) => void;

  checkoutDraft: CheckoutDraft;
  updateCheckoutDraft: (patch: Partial<CheckoutDraft>) => void;
  startCheckout: () => void;
};

type FavoritesContextValue = {
  isHydrated: boolean;
  items: FavoriteItem[];
  count: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
  addFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
};

type ApiCart = {
  id: string;
  couponCode?: string;
  items: Array<{
    itemId?: string;
    id: string;
    productId: string;
    slug: string;
    name: string;
    imageUrl: string;
    variant?: string;
    sizeLabel?: string;
    unitPriceCents?: number;
    unitPrice?: number;
    qty: number;
    stock: number;
  }>;
  totals?: {
    subtotalCents?: number;
    discountCents?: number;
    shippingCents?: number;
    taxCents?: number;
    totalCents?: number;
    subtotal?: number;
    discount?: number;
    shipping?: number;
    tax?: number;
    total?: number;
  };
};

type ApiFavorite = {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;
const AUTH_CHANGED_EVENT = "marima:auth-changed";

function isMongoId(value: string) {
  return MONGO_ID_REGEX.test(value);
}

function normalizeTotalsFromApi(cart: ApiCart): CartTotals {
  const subtotal = cart.totals?.subtotalCents ?? cart.totals?.subtotal ?? 0;
  const discount = cart.totals?.discountCents ?? cart.totals?.discount ?? 0;
  const shipping = cart.totals?.shippingCents ?? cart.totals?.shipping ?? 0;
  const tax = cart.totals?.taxCents ?? cart.totals?.tax ?? 0;
  const total = cart.totals?.totalCents ?? cart.totals?.total ?? subtotal - discount + shipping + tax;

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total,
  };
}

function normalizeCartStateFromApi(cart: ApiCart) {
  return {
    isHydrated: true,
    items: (cart.items || []).map((item) => ({
      id: item.itemId || item.id,
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      unitPrice: item.unitPriceCents ?? item.unitPrice ?? 0,
      qty: item.qty,
      stock: item.stock,
      variant: item.variant,
      sizeLabel: item.sizeLabel,
    })),
  };
}

function normalizeFavoritesFromApi(rows: ApiFavorite[]) {
  return {
    isHydrated: true,
    items: rows.map((item) => ({
      productId: item.productId,
      slug: item.slug,
      title: item.title,
      image: item.image,
      price: item.price,
    })),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cartState, dispatchCart] = useReducer(cartReducer, INITIAL_CART_STATE);
  const [favoritesState, dispatchFavorites] = useReducer(favoritesReducer, INITIAL_FAVORITES_STATE);
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuoting] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [serverTotals, setServerTotals] = useState<CartTotals | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hydrateSeq = useRef(0);
  const logoutLockUntil = useRef(0);

  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft>({
    zip: "",
    city: "",
    address: "",
    lgpdConsent: false,
    paymentMethod: "card",
    cardName: "",
    installments: "1",
  });

  const isHydrated = cartState.isHydrated && favoritesState.isHydrated;

  const syncCartFromApi = useCallback((cart: ApiCart) => {
    dispatchCart({ type: "hydrate", payload: normalizeCartStateFromApi(cart) });
    setServerTotals(normalizeTotalsFromApi(cart));
    setCoupon(cart.couponCode || null);
    setCartId(cart.id || null);
  }, []);

  const forceLogout = useCallback(
    (reason: "expired" | "unauthorized") => {
      const now = Date.now();
      if (now < logoutLockUntil.current) return;
      logoutLockUntil.current = now + 3000;

      setIsCustomer(false);
      setIsOpen(false);
      setError(null);
      dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });

      void (async () => {
        try {
          await apiFetch("/api/v1/auth/logout", { method: "POST" });
        } catch {
          // Ignore logout failures.
        } finally {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
          }

          const target = reason === "expired" ? "/login?reason=session-expired" : "/login";
          router.replace(target);
          router.refresh();
        }
      })();
    },
    [router],
  );

  useEffect(() => onAuthExpired(() => forceLogout("expired")), [forceLogout]);

  useEffect(() => {
    let active = true;

    async function hydrateFromBackend() {
      const seq = ++hydrateSeq.current;

      let customerSession = false;
      try {
        const me = await apiFetch<{ data: { type: "admin" | "customer" } }>("/api/v1/auth/me");
        customerSession = me.data?.type === "customer";
      } catch {
        customerSession = false;
      }

      if (!active || seq !== hydrateSeq.current) return;
      setIsCustomer(customerSession);

      try {
        const cartResponse = await apiFetch<{ data: ApiCart }>("/api/v1/me/cart");
        if (!active || seq !== hydrateSeq.current) return;
        syncCartFromApi(cartResponse.data);
      } catch {
        if (!active || seq !== hydrateSeq.current) return;
        dispatchCart({ type: "hydrate", payload: { isHydrated: true, items: [] } });
        setServerTotals(null);
        setCoupon(null);
        setCartId(null);
      }

      if (!active || seq !== hydrateSeq.current) return;

      if (customerSession) {
        try {
          const favoritesResponse = await apiFetch<{ data: ApiFavorite[] }>("/api/v1/me/favorites");
          if (!active || seq !== hydrateSeq.current) return;
          dispatchFavorites({ type: "hydrate", payload: normalizeFavoritesFromApi(favoritesResponse.data || []) });
        } catch {
          if (!active || seq !== hydrateSeq.current) return;
          dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });
        }
      } else {
        dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });
      }
    }

    void hydrateFromBackend();

    function onAuthChanged() {
      void hydrateFromBackend();
    }

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [syncCartFromApi]);

  const totals = useMemo(() => {
    if (serverTotals) return serverTotals;
    return calculateCartTotals(cartState.items, { discountCents: 0 });
  }, [cartState.items, serverTotals]);

  const itemCount = useMemo(
    () => cartState.items.reduce((acc, item) => acc + item.qty, 0),
    [cartState.items],
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);

  const addItem = useCallback(
    (input: CartItemInput) => {
      dispatchCart({ type: "add_item", payload: input });
      setError(null);
      open();

      if (!isMongoId(input.productId)) {
        setServerTotals(null);
        return;
      }

      void (async () => {
        try {
          const response = await apiFetch<{ data: ApiCart }>("/api/v1/me/cart/items", {
            method: "PUT",
            body: JSON.stringify({
              productId: input.productId,
              qty: input.qty || 1,
              variant: input.variant,
              sizeLabel: input.sizeLabel,
            }),
          });

          syncCartFromApi(response.data);
        } catch (err) {
          if (err instanceof HttpError) {
            setError(err.message || "Não foi possível atualizar o carrinho.");
          } else {
            setError("Não foi possível atualizar o carrinho.");
          }
        }
      })();
    },
    [open, syncCartFromApi],
  );

  const addProduct = useCallback(
    (product: Product, options?: { qty?: number; variant?: string; sizeLabel?: string }) => {
      addItem(toCartItemInput(product, options));
    },
    [addItem],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      const item = cartState.items.find((row) => row.id === itemId);
      dispatchCart({ type: "remove_item", payload: { itemId } });

      if (!item || !isMongoId(item.productId)) {
        setServerTotals(null);
        return;
      }

      void (async () => {
        try {
          const response = await apiFetch<{ data: ApiCart }>(`/api/v1/me/cart/items/${itemId}`, {
            method: "DELETE",
          });

          syncCartFromApi(response.data);
        } catch (err) {
          if (err instanceof HttpError) {
            setError(err.message || "Não foi possível remover o item do carrinho.");
          } else {
            setError("Não foi possível remover o item do carrinho.");
          }
        }
      })();
    },
    [cartState.items, syncCartFromApi],
  );

  const setQty = useCallback(
    (itemId: string, qty: number) => {
      const item = cartState.items.find((row) => row.id === itemId);
      dispatchCart({ type: "set_qty", payload: { itemId, qty } });

      if (!item || !isMongoId(item.productId)) {
        setServerTotals(null);
        return;
      }

      void (async () => {
        try {
          const response = await apiFetch<{ data: ApiCart }>(`/api/v1/me/cart/items/${itemId}`, {
            method: "PATCH",
            body: JSON.stringify({ qty }),
          });

          syncCartFromApi(response.data);
        } catch (err) {
          if (err instanceof HttpError) {
            setError(err.message || "Não foi possível atualizar a quantidade.");
          } else {
            setError("Não foi possível atualizar a quantidade.");
          }
        }
      })();
    },
    [cartState.items, syncCartFromApi],
  );

  const clear = useCallback(() => {
    const apiItems = cartState.items.filter((item) => isMongoId(item.productId));

    dispatchCart({ type: "clear" });
    setServerTotals(null);

    if (!apiItems.length) return;

    void (async () => {
      try {
        for (const item of apiItems) {
          await apiFetch(`/api/v1/me/cart/items/${item.id}`, { method: "DELETE" });
        }

        const response = await apiFetch<{ data: ApiCart }>("/api/v1/me/cart");
        syncCartFromApi(response.data);
      } catch (err) {
        if (err instanceof HttpError) {
          setError(err.message || "Não foi possível limpar o carrinho.");
        } else {
          setError("Não foi possível limpar o carrinho.");
        }
      }
    })();
  }, [cartState.items, syncCartFromApi]);

  const applyCoupon = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      setCoupon(normalized || null);
      setError(null);

      void (async () => {
        try {
          const response = await apiFetch<{ data: ApiCart }>("/api/v1/me/cart/apply-coupon", {
            method: "POST",
            body: JSON.stringify({ code: normalized }),
          });

          syncCartFromApi(response.data);
        } catch (err) {
          if (err instanceof HttpError) {
            setError(err.message || "Não foi possível aplicar o cupom.");
          } else {
            setError("Não foi possível aplicar o cupom.");
          }
        }
      })();
    },
    [syncCartFromApi],
  );

  const updateCheckoutDraft = useCallback((patch: Partial<CheckoutDraft>) => {
    setCheckoutDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const startCheckout = useCallback(() => {
    close();
    router.push("/checkout");
  }, [close, router]);

  const favoriteIds = useMemo(
    () => new Set(favoritesState.items.map((item) => item.productId)),
    [favoritesState.items],
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const addFavorite = useCallback((product: Product) => {
    if (!isCustomer) {
      router.push("/login");
      return;
    }

    void (async () => {
      try {
        const response = await apiFetch<{ data: ApiFavorite }>("/api/v1/me/favorites", {
          method: "POST",
          body: JSON.stringify({ productId: product.id }),
        });

        dispatchFavorites({ type: "add", payload: normalizeFavoritesFromApi([response.data]).items[0]! });
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          const code =
            typeof err.payload === "object" && err.payload !== null && "code" in err.payload
              ? String((err.payload as Record<string, unknown>).code || "")
              : "";

          if (code === "AUTH_EXPIRED") {
            forceLogout("expired");
            return;
          }

          setIsCustomer(false);
          dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });
          router.push("/login");
        }
      }
    })();
  }, [forceLogout, isCustomer, router]);

  const removeFavorite = useCallback((productId: string) => {
    if (!isCustomer || !isMongoId(productId)) return;

    dispatchFavorites({ type: "remove", payload: { productId } });

    void apiFetch(`/api/v1/me/favorites/${productId}`, { method: "DELETE" }).catch((err) => {
      if (err instanceof HttpError && err.status === 401) {
        const code =
          typeof err.payload === "object" && err.payload !== null && "code" in err.payload
            ? String((err.payload as Record<string, unknown>).code || "")
            : "";

        if (code === "AUTH_EXPIRED") {
          forceLogout("expired");
          return;
        }

        setIsCustomer(false);
        dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });
        router.push("/login");
      }
    });
  }, [forceLogout, isCustomer, router]);

  const toggleFavorite = useCallback((product: Product) => {
    if (!isCustomer) {
      router.push("/login");
      return;
    }

    const item = toFavoriteItem(product);
    const exists = favoritesState.items.some((entry) => entry.productId === product.id);

    dispatchFavorites({ type: "toggle", payload: item });

    if (!isMongoId(product.id)) return;

    if (exists) {
      void apiFetch(`/api/v1/me/favorites/${product.id}`, { method: "DELETE" }).catch((err) => {
        if (err instanceof HttpError && err.status === 401) {
          const code =
            typeof err.payload === "object" && err.payload !== null && "code" in err.payload
              ? String((err.payload as Record<string, unknown>).code || "")
              : "";

          if (code === "AUTH_EXPIRED") {
            forceLogout("expired");
            return;
          }

          setIsCustomer(false);
          dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });
          router.push("/login");
        }
      });
      return;
    }

    void apiFetch("/api/v1/me/favorites", {
      method: "POST",
      body: JSON.stringify({ productId: product.id }),
    }).catch((err) => {
      if (err instanceof HttpError && err.status === 401) {
        const code =
          typeof err.payload === "object" && err.payload !== null && "code" in err.payload
            ? String((err.payload as Record<string, unknown>).code || "")
            : "";

        if (code === "AUTH_EXPIRED") {
          forceLogout("expired");
          return;
        }

        setIsCustomer(false);
        dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });
        router.push("/login");
      }
    });
  }, [favoritesState.items, forceLogout, isCustomer, router]);

  const clearFavorites = useCallback(() => {
    if (!isCustomer) {
      router.push("/login");
      return;
    }

    const apiFavorites = favoritesState.items.filter((item) => isMongoId(item.productId));
    dispatchFavorites({ type: "clear" });

    if (!apiFavorites.length) return;

    void Promise.all(apiFavorites.map((item) => apiFetch(`/api/v1/me/favorites/${item.productId}`, { method: "DELETE" })))
      .catch((err) => {
        if (err instanceof HttpError && err.status === 401) {
          const code =
            typeof err.payload === "object" && err.payload !== null && "code" in err.payload
              ? String((err.payload as Record<string, unknown>).code || "")
              : "";

          if (code === "AUTH_EXPIRED") {
            forceLogout("expired");
            return;
          }

          setIsCustomer(false);
          dispatchFavorites({ type: "hydrate", payload: { isHydrated: true, items: [] } });
          router.push("/login");
        }
      });
  }, [favoritesState.items, forceLogout, isCustomer, router]);

  const cartValue = useMemo<CartContextValue>(
    () => ({
      isHydrated,
      isOpen,
      open,
      close,
      toggle,
      triggerRef,
      cartId,
      items: cartState.items,
      itemCount,
      totals,
      coupon,
      isQuoting,
      error,
      setError,
      addItem,
      addProduct,
      removeItem,
      setQty,
      clear,
      applyCoupon,
      checkoutDraft,
      updateCheckoutDraft,
      startCheckout,
    }),
    [
      isHydrated,
      isOpen,
      open,
      close,
      toggle,
      cartId,
      cartState.items,
      itemCount,
      totals,
      coupon,
      isQuoting,
      error,
      addItem,
      addProduct,
      removeItem,
      setQty,
      clear,
      applyCoupon,
      checkoutDraft,
      updateCheckoutDraft,
      startCheckout,
    ],
  );

  const favoritesValue = useMemo<FavoritesContextValue>(
    () => ({
      isHydrated,
      items: favoritesState.items,
      count: favoritesState.items.length,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [
      isHydrated,
      favoritesState.items,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      clearFavorites,
    ],
  );

  return (
    <FavoritesContext.Provider value={favoritesValue}>
      <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
    </FavoritesContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within StoreProvider");
  return context;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within StoreProvider");
  return context;
}
