"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/storage-store";
import { useHydrated } from "@/lib/use-hydrated";
import type { City, VisitedCity } from "@/lib/types";

const MAX_ENTRIES = 8;

const EMPTY: VisitedCity[] = [];

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

export function recordVisit(city: City): void {
  const current = historyStore.getSnapshot();

  const withoutCity = current.filter((visited) => visited.id !== city.id);
  historyStore.set([toVisited(city), ...withoutCity].slice(0, MAX_ENTRIES));
}

export interface UseSearchHistoryResult {
  history: VisitedCity[];
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
