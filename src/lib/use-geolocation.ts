"use client";

import { useCallback, useState } from "react";
import type { ReverseGeocodingApiResponse } from "@/app/api/reverse-geocoding/route";
import type { City } from "@/lib/types";

const TIMEOUT_MS = 10_000;

const MAX_AGE_MS = 5 * 60 * 1000;

function describeGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Localisation refusée. Autorisez-la dans les réglages de votre navigateur.";
    case error.POSITION_UNAVAILABLE:
      return "Position indisponible. Vérifiez que la localisation est activée.";
    case error.TIMEOUT:
      return "La localisation a pris trop de temps. Réessayez.";
    default:
      return "Impossible de vous localiser.";
  }
}

function requestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: TIMEOUT_MS,
      maximumAge: MAX_AGE_MS,
    });
  });
}

export interface UseGeolocationResult {
  isLocating: boolean;
  error: string | null;
  locate: () => Promise<City | null>;
  clearError: () => void;
}

export function useGeolocation(): UseGeolocationResult {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const locate = useCallback(async (): Promise<City | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Votre navigateur ne permet pas la géolocalisation.");
      return null;
    }

    setIsLocating(true);
    setError(null);

    try {
      const position = await requestPosition();
      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `/api/reverse-geocoding?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`,
      );

      if (!response.ok) {
        setError(
          response.status === 404
            ? "Aucune ville identifiée à votre position."
            : "Localisation indisponible pour le moment.",
        );
        return null;
      }

      const data: ReverseGeocodingApiResponse = await response.json();
      return data.city;
    } catch (cause) {
      setError(
        cause instanceof GeolocationPositionError || (cause as GeolocationPositionError)?.code
          ? describeGeolocationError(cause as GeolocationPositionError)
          : "Localisation indisponible pour le moment.",
      );
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  return { isLocating, error, locate, clearError };
}
