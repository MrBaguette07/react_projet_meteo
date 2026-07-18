"use client";

/**
 * Préférence d'unités de mesure (métrique / impérial).
 *
 * Le choix est persisté dans le `localStorage` et suit le même contrat que les
 * favoris : un store externe au niveau du module, consommé via
 * `useSyncExternalStore`. Aucun `<Provider>` n'est donc nécessaire, et le layout
 * racine reste un Server Component intégral.
 *
 * **Pourquoi la conversion vit ici et pas dans l'API.** Les données sont toujours
 * récupérées en métrique, quel que soit le système choisi : c'est ce qui permet de
 * conserver un seul jeu de données en cache côté serveur, partagé par tous les
 * visiteurs. Basculer en impérial ne déclenche donc aucun appel réseau - seule la
 * mise en forme change, au moment du rendu.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/storage-store";
import { useHydrated } from "@/lib/use-hydrated";

/** Systèmes d'unités proposés. */
export type UnitSystem = "metric" | "imperial";

/**
 * Système par défaut.
 *
 * Le métrique est retenu comme repli car il correspond aux unités natives
 * d'Open-Meteo et à la langue de l'interface.
 */
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

/* -------------------------------------------------------------------------- */
/*                                 Conversions                                */
/* -------------------------------------------------------------------------- */

/** Celsius → Fahrenheit. */
export function toFahrenheit(celsius: number): number {
  return celsius * 1.8 + 32;
}

/** Kilomètres/heure → miles/heure. */
export function toMilesPerHour(kilometersPerHour: number): number {
  return kilometersPerHour / 1.609344;
}

/** Millimètres → pouces. */
export function toInches(millimeters: number): number {
  return millimeters / 25.4;
}

/** Hectopascals → pouces de mercure. */
export function toInchesOfMercury(hectopascals: number): number {
  return hectopascals / 33.863886;
}

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export interface UseUnitsResult {
  system: UnitSystem;
  /** `false` pendant le rendu serveur et l'hydratation, où la préférence est inconnue. */
  isLoaded: boolean;
  isImperial: boolean;
  setSystem: (system: UnitSystem) => void;
  /** Bascule d'un système à l'autre. */
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
