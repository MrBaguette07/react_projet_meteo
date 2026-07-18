"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/storage-store";
import { useHydrated } from "@/lib/use-hydrated";

export type UnitSystem = "metric" | "imperial";

const DEFAULT_SYSTEM: UnitSystem = "metric";

function parseUnitSystem(raw: string): UnitSystem {
  const parsed: unknown = JSON.parse(raw);
  return parsed === "imperial" || parsed === "metric" ? parsed : DEFAULT_SYSTEM;
}

const unitStore = createStorageStore<UnitSystem>({
  key: "meteo-app:units:v1",
  area: "local",
  parse: parseUnitSystem,
  fallback: DEFAULT_SYSTEM,
});

export function toFahrenheit(celsius: number): number {
  return celsius * 1.8 + 32;
}

export function toMilesPerHour(kilometersPerHour: number): number {
  return kilometersPerHour / 1.609344;
}

export function toInches(millimeters: number): number {
  return millimeters / 25.4;
}

export function toInchesOfMercury(hectopascals: number): number {
  return hectopascals / 33.863886;
}

export interface UseUnitsResult {
  system: UnitSystem;
  isLoaded: boolean;
  isImperial: boolean;
  setSystem: (system: UnitSystem) => void;
  toggleSystem: () => void;
}

export function useUnits(): UseUnitsResult {
  const system = useSyncExternalStore(
    unitStore.subscribe,
    unitStore.getSnapshot,
    unitStore.getServerSnapshot,
  );
  const isLoaded = useHydrated();

  const setSystem = useCallback((next: UnitSystem) => unitStore.set(next), []);

  const toggleSystem = useCallback(() => {
    unitStore.set(unitStore.getSnapshot() === "metric" ? "imperial" : "metric");
  }, []);

  return useMemo(
    () => ({
      system,
      isLoaded,
      isImperial: system === "imperial",
      setSystem,
      toggleSystem,
    }),
    [system, isLoaded, setSystem, toggleSystem],
  );
}
