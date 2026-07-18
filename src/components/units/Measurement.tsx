"use client";

import { formatMeasure, formatTemperature } from "@/lib/format";
import {
  toFahrenheit,
  toInches,
  toInchesOfMercury,
  toMilesPerHour,
  useUnits,
} from "@/lib/units";

interface TemperatureProps {
  celsius: number;
}

export function Temperature({ celsius }: TemperatureProps) {
  const { isImperial } = useUnits();
  return <>{formatTemperature(isImperial ? toFahrenheit(celsius) : celsius)}</>;
}

export function TemperatureUnit() {
  const { isImperial } = useUnits();
  return <>{isImperial ? "°F" : "°C"}</>;
}

interface WindSpeedProps {
  kilometersPerHour: number;
}

export function WindSpeed({ kilometersPerHour }: WindSpeedProps) {
  const { isImperial } = useUnits();

  return isImperial ? (
    <>{formatMeasure(toMilesPerHour(kilometersPerHour), "mph")}</>
  ) : (
    <>{formatMeasure(kilometersPerHour, "km/h")}</>
  );
}

interface PrecipitationProps {
  millimeters: number;
}

export function Precipitation({ millimeters }: PrecipitationProps) {
  const { isImperial } = useUnits();

  return isImperial ? (
    <>{formatMeasure(toInches(millimeters), "in", 2)}</>
  ) : (
    <>{formatMeasure(millimeters, "mm", 1)}</>
  );
}

interface PressureProps {
  hectopascals: number;
}

export function Pressure({ hectopascals }: PressureProps) {
  const { isImperial } = useUnits();

  return isImperial ? (
    <>{formatMeasure(toInchesOfMercury(hectopascals), "inHg", 2)}</>
  ) : (
    <>{formatMeasure(hectopascals, "hPa")}</>
  );
}
