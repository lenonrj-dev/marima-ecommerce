import type { Metadata } from "next";
import FavoritesGrid from "@/components/dashboard/favorites/FavoritesGrid";

export const metadata: Metadata = {
  title: "Favoritos na conta Marima: produtos salvos para comprar com rapidez",
};

export default function DashboardFavoritosPage() {
  return <FavoritesGrid />;
}
