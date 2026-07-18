"use client";

/**
 * Source de vérité unique des villes favorites.
 *
 * Le store est déclaré au niveau du module : tous les composants qui appellent
 * `useFavorites()` observent la même instance et se re-rendent ensemble. Aucun
 * `<Provider>` n'est donc nécessaire - le layout racine reste un Server Component
 * intégral, et seuls les composants réellement interactifs basculent côté client.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/storage-store";
import { useHydrated } from "@/lib/use-hydrated";
import type { City, FavoriteCity } from "@/lib/types";

/** Instantané serveur et valeur de repli - constante partagée, donc stable. */
const EMPTY: FavoriteCity[] = [];

/**
 * Valide le contenu du stockage.
 *
 * Le `localStorage` est modifiable par l'utilisateur : une entrée corrompue ne doit
 * jamais faire planter l'application, seulement être ignorée.
 */
function parseFavorites(raw: string): FavoriteCity[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return EMPTY;

  const valid = parsed.filter((item): item is FavoriteCity => {
    if (typeof item !== "object" || item === null) return false;
    const candidate = item as Partial<FavoriteCity>;
    return (
      typeof candidate.id === "number" &&
      typeof candidate.name === "string" &&
      typeof candidate.latitude === "number" &&
      typeof candidate.longitude === "number"
    );
  });

  return valid.length > 0 ? valid : EMPTY;
}

const favoritesStore = createStorageStore<FavoriteCity[]>({
  key: "meteo-app:favorites:v1",
  area: "local",
  parse: parseFavorites,
  fallback: EMPTY,
});

/** Ne conserve que les champs utiles : la météo est toujours re-téléchargée. */
function toFavorite(city: City): FavoriteCity {
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
    admin1: city.admin1,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    addedAt: Date.now(),
  };
}

export interface UseFavoritesResult {
  favorites: FavoriteCity[];
  /** `false` pendant le rendu serveur et l'hydratation, où la liste est inconnue. */
  isLoaded: boolean;
  isFavorite: (cityId: number) => boolean;
  addFavorite: (city: City) => void;
  removeFavorite: (cityId: number) => void;
  /** Bascule l'état favori d'une ville. */
  toggleFavorite: (city: City) => void;
  clearFavorites: () => void;
}

export function useFavorites(): UseFavoritesResult {
  const favorites = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  );
  const isLoaded = useHydrated();

  const addFavorite = useCallback((city: City) => {
    const current = favoritesStore.getSnapshot();
    if (current.some((favorite) => favorite.id === city.id)) return;
    // Les ajouts récents apparaissent en tête de liste.
    favoritesStore.set([toFavorite(city), ...current]);
  }, []);

  const removeFavorite = useCallback((cityId: number) => {
    favoritesStore.set(
      favoritesStore.getSnapshot().filter((favorite) => favorite.id !== cityId),
    );
  }, []);

  const toggleFavorite = useCallback(
    (city: City) => {
      const exists = favoritesStore.getSnapshot().some((favorite) => favorite.id === city.id);
      if (exists) removeFavorite(city.id);
      else addFavorite(city);
    },
    [addFavorite, removeFavorite],
  );

  const clearFavorites = useCallback(() => favoritesStore.set(EMPTY), []);

  const isFavorite = useCallback(
    (cityId: number) => favorites.some((favorite) => favorite.id === cityId),
    [favorites],
  );

  return useMemo(
    () => ({
      favorites,
      isLoaded,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      clearFavorites,
    }),
    [favorites, isLoaded, isFavorite, addFavorite, removeFavorite, toggleFavorite, clearFavorites],
  );
}
