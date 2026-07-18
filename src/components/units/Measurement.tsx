"use client";

/**
 * Affichage d'une mesure, converti selon la préférence d'unités de l'utilisateur.
 *
 * **Ces composants sont volontairement des feuilles.** Les composants qui les
 * utilisent - `CurrentConditions`, `DailyForecastList`, `HourlyStrip`… - restent
 * des Server Components : seule la portion de texte réellement dépendante d'une
 * préférence navigateur bascule côté client. La page de détail continue donc
 * d'arriver complète dans le HTML, et le JavaScript envoyé se limite à quelques
 * nœuds de texte.
 *
 * Les valeurs reçues sont **toujours métriques** : c'est l'unité native
 * d'Open-Meteo, et la conserver en amont permet de garder un seul jeu de données
 * en cache côté serveur, partagé quel que soit le système d'affichage choisi.
 *
 * Pendant le rendu serveur et l'hydratation, `useUnits()` renvoie le système par
 * défaut (métrique). Le HTML initial est donc cohérent avec ce que React attend,
 * et un utilisateur ayant choisi l'impérial voit la valeur se convertir juste
 * après l'hydratation, sans erreur de correspondance.
 */

import { formatMeasure, formatTemperature } from "@/lib/format";
import {
  toFahrenheit,
  toInches,
  toInchesOfMercury,
  toMilesPerHour,
  useUnits,
} from "@/lib/units";

/* -------------------------------------------------------------------------- */
/*                                 Température                                */
/* -------------------------------------------------------------------------- */

interface TemperatureProps {
  /** Température en degrés Celsius. */
  celsius: number;
}

/** Température arrondie, suivie du symbole degré (ex. « 18° »). */
export function Temperature({ celsius }: TemperatureProps) {
  const { isImperial } = useUnits();
  return <>{formatTemperature(isImperial ? toFahrenheit(celsius) : celsius)}</>;
}

/** Symbole de l'unité de température courante (« °C » ou « °F »). */
export function TemperatureUnit() {
  const { isImperial } = useUnits();
  return <>{isImperial ? "°F" : "°C"}</>;
}

/* -------------------------------------------------------------------------- */
/*                                    Vent                                    */
/* -------------------------------------------------------------------------- */

interface WindSpeedProps {
  /** Vitesse en kilomètres par heure. */
  kilometersPerHour: number;
}

/** Vitesse de vent avec son unité (ex. « 12 km/h » ou « 7 mph »). */
export function WindSpeed({ kilometersPerHour }: WindSpeedProps) {
  const { isImperial } = useUnits();

  return isImperial ? (
    <>{formatMeasure(toMilesPerHour(kilometersPerHour), "mph")}</>
  ) : (
    <>{formatMeasure(kilometersPerHour, "km/h")}</>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Précipitations                               */
/* -------------------------------------------------------------------------- */

interface PrecipitationProps {
  /** Cumul en millimètres. */
  millimeters: number;
}

/**
 * Cumul de précipitations (ex. « 2,4 mm » ou « 0,09 in »).
 *
 * Les pouces sont affichés avec deux décimales : un millimètre valant environ
 * 0,04 in, une seule décimale écraserait à « 0,0 in » toute pluie faible.
 */
export function Precipitation({ millimeters }: PrecipitationProps) {
  const { isImperial } = useUnits();

  return isImperial ? (
    <>{formatMeasure(toInches(millimeters), "in", 2)}</>
  ) : (
    <>{formatMeasure(millimeters, "mm", 1)}</>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Pression                                  */
/* -------------------------------------------------------------------------- */

interface PressureProps {
  /** Pression en hectopascals. */
  hectopascals: number;
}

/** Pression atmosphérique (ex. « 1013 hPa » ou « 29,91 inHg »). */
export function Pressure({ hectopascals }: PressureProps) {
  const { isImperial } = useUnits();

  return isImperial ? (
    <>{formatMeasure(toInchesOfMercury(hectopascals), "inHg", 2)}</>
  ) : (
    <>{formatMeasure(hectopascals, "hPa")}</>
  );
}
