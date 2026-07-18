"use client";

import { temperatureTextColor } from "@/lib/temperature-scale";
import { toFahrenheit, useUnits } from "@/lib/units";

interface ConvertedTemperatureProps {
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
