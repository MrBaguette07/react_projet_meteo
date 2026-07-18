"use client";

/**
 * Récupération de la météo côté client, avec cache partagé entre composants.
 *
 * Le cache est un `Map` au niveau du module - donc commun à toute l'application -
 * qui stocke la **promesse** et non la valeur résolue. C'est ce détail qui élimine
 * la duplication : si la grille des favoris et le comparateur demandent Lyon à la
 * même milliseconde, le second appel récupère la promesse en vol du premier au lieu
 * de lancer une seconde requête.
 */

import { useEffect, useState } from "react";
import type { WeatherApiResponse } from "@/app/api/weather/route";
import type { WeatherBundle } from "@/lib/types";

/** Durée de validité d'une entrée du cache client (5 min). */
const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  promise: Promise<WeatherBundle>;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

/** Clé de cache : les coordonnées arrondies suffisent à identifier une ville. */
function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

/**
 * Charge la météo d'un point, en réutilisant une requête en cours ou récente.
 *
 * Exportée séparément du hook pour rester utilisable hors du cycle de rendu React.
 */
export function fetchCityWeather(latitude: number, longitude: number): Promise<WeatherBundle> {
  const key = cacheKey(latitude, longitude);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.createdAt < TTL_MS) {
    return cached.promise;
  }

  const promise = fetch(`/api/weather?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Météo indisponible (${response.status}).`);
      return (await response.json()) as WeatherApiResponse;
    })
    .catch((error: unknown) => {
      // Un échec ne doit pas être mémorisé, sinon l'erreur serait rejouée
      // pendant toute la durée du TTL sans jamais retenter l'appel.
      cache.delete(key);
      throw error;
    });

  cache.set(key, { promise, createdAt: Date.now() });
  return promise;
}

export interface CityWeatherState {
  weather: WeatherBundle | null;
  isLoading: boolean;
  error: string | null;
}

/** État interne : le résultat est estampillé de la ville à laquelle il correspond. */
interface KeyedState extends CityWeatherState {
  key: string;
}

const PENDING: CityWeatherState = { weather: null, isLoading: true, error: null };

/** Hook de chargement de la météo d'une ville, résistant aux réponses hors séquence. */
export function useCityWeather(latitude: number, longitude: number): CityWeatherState {
  const key = cacheKey(latitude, longitude);
  const [state, setState] = useState<KeyedState>({ ...PENDING, key });

  useEffect(() => {
    // `cancelled` évite une mise à jour après démontage, et surtout empêche une
    // réponse tardive d'écraser celle d'une ville sélectionnée entre-temps.
    let cancelled = false;

    fetchCityWeather(latitude, longitude)
      .then((weather) => {
        if (!cancelled) setState({ key, weather, isLoading: false, error: null });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ key, weather: null, isLoading: false, error: "Météo indisponible." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, key]);

  // Quand les coordonnées changent, l'état encore en mémoire décrit la ville
  // précédente : on le remplace par « en chargement » **au rendu** plutôt que via
  // un `setState` dans l'effet, ce qui économise un rendu et évite d'afficher un
  // instant la météo de la ville quittée.
  return state.key === key ? state : PENDING;
}
