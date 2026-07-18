"use client";

/**
 * Localisation de l'utilisateur, résolue en une ville.
 *
 * Le hook enchaîne deux étapes : l'API `navigator.geolocation` du navigateur, qui
 * demande son accord à l'utilisateur, puis notre route de géocodage inverse qui
 * transforme les coordonnées obtenues en `City` complète.
 *
 * La demande n'est **jamais déclenchée au montage** : elle part uniquement sur une
 * action explicite. Une invite de permission qui surgit au chargement d'une page
 * est massivement refusée — et une fois refusée, la plupart des navigateurs ne la
 * reproposent plus.
 */

import { useCallback, useState } from "react";
import type { ReverseGeocodingApiResponse } from "@/app/api/reverse-geocoding/route";
import type { City } from "@/lib/types";

/** Au-delà, on abandonne : l'utilisateur attend depuis trop longtemps. */
const TIMEOUT_MS = 10_000;

/**
 * Position vieille de moins de 5 minutes acceptée telle quelle.
 *
 * La météo d'une ville ne change pas à l'échelle de quelques centaines de mètres :
 * réutiliser une position récente évite de réactiver le GPS pour rien.
 */
const MAX_AGE_MS = 5 * 60 * 1000;

/** Messages associés aux codes d'erreur de l'API de géolocalisation. */
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

/** Encapsule l'API de géolocalisation, qui est à base de callbacks, dans une promesse. */
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
  /** `true` pendant la demande de position et la résolution de la ville. */
  isLocating: boolean;
  error: string | null;
  /** Lance la localisation et renvoie la ville trouvée, ou `null` en cas d'échec. */
  locate: () => Promise<City | null>;
  /** Efface le message d'erreur affiché. */
  clearError: () => void;
}

export function useGeolocation(): UseGeolocationResult {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const locate = useCallback(async (): Promise<City | null> => {
    // Contexte non sécurisé (HTTP) ou navigateur ancien : l'API est absente.
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
      // Seules les erreurs de géolocalisation portent un code ; les autres
      // proviennent du réseau et méritent un message distinct.
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
