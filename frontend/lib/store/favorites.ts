import type { Product } from "@/lib/productsData";

export const FAVORITES_STORAGE_KEY = "marima_favorites_v1";

export type FavoriteItem = { productId : string;
  slug: string;
  title: string;
  image: string;
  price: number;
};

export type FavoritesState = { items : FavoriteItem[];
  isHydrated: boolean;
};

export type FavoritesReducerAction =
  | { type: "hydrate"; payload: FavoritesState }
  | { type: "add"; payload: FavoriteItem }
  | { type: "remove"; payload: { productId: string } }
  | { type: "toggle"; payload: FavoriteItem }
  | { type: "clear" };

export const INITIAL_FAVORITES_STATE: FavoritesState = { items : [],
  isHydrated: false,
};

function isFavoriteItem(value: unknown): value is FavoriteItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FavoriteItem>;
  return (
    typeof candidate.productId === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.image === "string" &&
    typeof candidate.price === "number"
  );
}

export function sanitizeFavoritesState(value: unknown): FavoritesState {
  if (!value || typeof value !== "object") {
    return {
      items: [],
      isHydrated: true,
    };
  }

  const parsed = value as { items?: unknown[] };
  const items = Array.isArray(parsed.items) ? parsed.items.filter(isFavoriteItem) : [];

  const unique = Array.from(
    new Map(items.map((item) => [item.productId, item] as const)).values(),
  );

  return {
    items: unique,
    isHydrated: true,
  };
}

export function toFavoriteItem(product: Product): FavoriteItem {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    image: product.image,
    price: product.price,
  };
}

export function favoritesReducer(state: FavoritesState, action : FavoritesReducerAction,
): FavoritesState {
  switch (action.type) {
    case "hydrate":
      return sanitizeFavoritesState(action.payload);

    case "add": {
      if (state.items.some((item) => item.productId === action.payload.productId)) {
        return state;
      }
      return { ...state, items: [...state.items, action.payload] };
    }

    case "remove":
      return {
        ...state,
        items: state.items.filter((item) => item.productId !== action.payload.productId),
      };

    case "toggle": {
      const exists = state.items.some((item) => item.productId === action.payload.productId);
      if (exists) {
        return {
          ...state,
          items: state.items.filter((item) => item.productId !== action.payload.productId),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }

    case "clear":
      return {
        ...state,
        items: [],
      };
  }
}
