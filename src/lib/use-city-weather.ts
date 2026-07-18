"use client";

import { useEffect, useState } from "react";
import type { WeatherApiResponse } from "@/app/api/weather/route";
import type { WeatherBundle } from "@/lib/types";

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  promise: Promise<WeatherBundle>;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

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

interface KeyedState extends CityWeatherState {
  key: string;
}

const PENDING: CityWeatherState = { weather: null, isLoading: true, error: null };

export function useCityWeather(latitude: number, longitude: number): CityWeatherState {
  const key = cacheKey(latitude, longitude);
  const [state, setState] = useState<KeyedState>({ ...PENDING, key });

  useEffect(() => {
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

  return state.key === key ? state : PENDING;
}
