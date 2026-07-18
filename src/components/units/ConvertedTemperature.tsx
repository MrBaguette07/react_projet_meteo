"use client";

/**
 * Grand relevé de température, sans symbole degré.
 *
 * Distinct de `<Temperature>` parce que l'unité est ici affichée à part, dans une
 * typographie et une taille différentes (voir `CurrentConditions`). Le composant
 * ne rend donc que le nombre.
 *
 * La couleur est calculée à partir de la valeur **Celsius** d'origine, jamais de
 * la valeur convertie : l'échelle chromatique est définie en Celsius, et la
 * teinte d'une ville ne doit pas changer selon le système d'unités affiché.
 */

import { temperatureTextColor } from "@/lib/temperature-scale";
import { toFahrenheit, useUnits } from "@/lib/units";

interface ConvertedTemperatureProps {
  /** Température en degrés Celsius. */
  celsius: number;
  className?: string;
}

export function ConvertedTemperature({ celsius, className }: ConvertedTemperatureProps) {
  const { isImperial } = useUnits();
  const displayed = isImperial ? toFahrenheit(celsius) : celsius;

  return (
    <span className={className} style={{ color: temperatureTextColor(celsius) }}>
      {Math.round(displayed)}
    </span>
  );
}
