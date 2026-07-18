"use client";

/**
 * Historique des villes consultées.
 *
 * Même contrat que les favoris : un store externe au niveau du module, consommé
 * via `useSyncExternalStore`. Les deux listes répondent toutefois à des besoins
 * distincts et restent séparées — les favoris sont **choisis**, l'historique est
 * **subi**. Une ville consultée par curiosité n'a pas à encombrer les favoris, et
 * un favori ne doit pas disparaître parce qu'on a consulté d'autres villes depuis.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/storage-store";
import { useHydrated } from "@/lib/use-hydrated";
import type { City, VisitedCity } from "@/lib/types";

/**
 * Nombre d'entrées conservées.
 *
 * L'historique est une commodité, pas une archive : au-delà d'une poignée
 * d'entrées, retrouver une ville dans la liste devient plus lent que la
 * rechercher à nouveau.
 */
const MAX_ENTRIES = 8;

/** Instantané serveur et valeur de repli — constante partagée, donc stable. */
const EMPTY: VisitedCity[] = [];

/** Valide le contenu du stockage ; une entrée corrompue est ignorée. */
function parseHistory(raw: string): VisitedCity[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return EMPTY;

  const valid = parsed.filter((item): item is VisitedCity => {
    if (typeof item !== "object" || item === null) return false;
    const candidate = item as Partial<VisitedCity>;
    return (
      typeof candidate.id === "number" &&
      typeof candidate.name === "string" &&
      typeof candidate.latitude === "number" &&
      typeof candidate.longitude === "number" &&
      typeof candidate.visitedAt === "number"
    );
  });

  return valid.length > 0 ? valid.slice(0, MAX_ENTRIES) : EMPTY;
}

const historyStore = createStorageStore<VisitedCity[]>({
  key: "meteo-app:history:v1",
  area: "local",
  parse: parseHistory,
  fallback: EMPTY,
});

/** Ne conserve que l'identité de la ville : la météo est toujours re-téléchargée. */
function toVisited(city: City): VisitedCity {
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
    admin1: city.admin1,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    visitedAt: Date.now(),
  };
}

/**
 * Enregistre une consultation.
 *
 * Exportée hors du hook pour être appelable depuis un effet de page, sans imposer
 * au composant appelant de s'abonner à l'historique — s'y abonner le ferait se
 * re-rendre à chaque visite enregistrée, y compris la sienne.
 */
export function recordVisit(city: City): void {
  const current = historyStore.getSnapshot();

  // Une ville déjà présente remonte en tête plutôt que d'être dupliquée :
  // l'historique reflète la dernière consultation, pas toutes les consultations.
  const withoutCity = current.filter((visited) => visited.id !== city.id);
  historyStore.set([toVisited(city), ...withoutCity].slice(0, MAX_ENTRIES));
}

export interface UseSearchHistoryResult {
  history: VisitedCity[];
  /** `false` pendant le rendu serveur et l'hydratation, où la liste est inconnue. */
  isLoaded: boolean;
  removeVisit: (cityId: number) => void;
  clearHistory: () => void;
}

export function useSearchHistory(): UseSearchHistoryResult {
  const history = useSyncExternalStore(
    historyStore.subscribe,
    historyStore.getSnapshot,
    historyStore.getServerSnapshot,
  );
  const isLoaded = useHydrated();

  const removeVisit = useCallback((cityId: number) => {
    historyStore.set(historyStore.getSnapshot().filter((visited) => visited.id !== cityId));
  }, []);

  const clearHistory = useCallback(() => historyStore.set(EMPTY), []);

  return useMemo(
    () => ({ history, isLoaded, removeVisit, clearHistory }),
    [history, isLoaded, removeVisit, clearHistory],
  );
}
