/**
 * Bande horizontale des 24 prochaines heures.
 *
 * La courbe de température est tracée en SVG à partir des données, sans librairie
 * de graphes : les valeurs sont normalisées sur l'amplitude réelle de la période,
 * ce qui rend les variations lisibles même par temps stable.
 *
 * Le tracé n'est pas d'une couleur unique - chaque segment prend la teinte de sa
 * température. La courbe devient ainsi sa propre légende : on voit la journée se
 * réchauffer puis se refroidir.
 */

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/Metric";
import { WeatherIcon } from "@/components/WeatherIcon";
import { describeWeather } from "@/lib/weather-codes";
import { temperatureColor } from "@/lib/temperature-scale";
import { formatTime } from "@/lib/format";
import { Temperature } from "@/components/units/Measurement";
import type { HourlyForecast } from "@/lib/types";

/** Hauteur du tracé, en unités du `viewBox`. */
const CHART_HEIGHT = 44;
/** Espacement horizontal entre deux points, aligné sur la largeur des colonnes. */
const COLUMN_WIDTH = 62;

export function HourlyStrip({ hours }: { hours: HourlyForecast[] }) {
  const temperatures = hours.map((hour) => hour.temperature);
  const min = Math.min(...temperatures);
  const max = Math.max(...temperatures);
  // Amplitude plancher de 1 °C : évite une division par zéro et l'aplatissement
  // du tracé lorsque la température ne bouge pas de la journée.
  const range = Math.max(1, max - min);

  const points = temperatures.map((temperature, index) => ({
    x: index * COLUMN_WIDTH + COLUMN_WIDTH / 2,
    y: CHART_HEIGHT - ((temperature - min) / range) * (CHART_HEIGHT - 10) - 5,
    color: temperatureColor(temperature),
  }));

  const chartWidth = hours.length * COLUMN_WIDTH;

  return (
    <Card>
      <CardContent>
        <SectionHeading
          aside={
            <span className="tabular font-mono text-xs text-muted-foreground">
              <Temperature celsius={min} /> → <Temperature celsius={max} />
            </span>
          }
        >
          Prochaines 24 heures
        </SectionHeading>

        <div className="-mx-1 mt-4 overflow-x-auto pb-1">
          <div className="relative" style={{ width: chartWidth, minWidth: "100%" }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
              width={chartWidth}
              height={CHART_HEIGHT}
              preserveAspectRatio="none"
              className="block"
              aria-hidden="true"
            >
              {/* Un segment par intervalle, dégradé entre les deux températures. */}
              {points.slice(0, -1).map((point, index) => {
                const next = points[index + 1];
                return (
                  <line
                    key={point.x}
                    x1={point.x}
                    y1={point.y}
                    x2={next.x}
                    y2={next.y}
                    stroke={point.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                );
              })}
              {points.map((point) => (
                <circle key={point.x} cx={point.x} cy={point.y} r="2.6" fill={point.color} />
              ))}
            </svg>

            <ul className="flex">
              {hours.map((hour, index) => (
                <li
                  key={hour.time}
                  className="flex shrink-0 flex-col items-center gap-1.5 pt-2.5"
                  style={{ width: COLUMN_WIDTH }}
                >
                  <span className="tabular font-heading text-sm font-semibold">
                    <Temperature celsius={hour.temperature} />
                  </span>
                  <WeatherIcon
                    name={describeWeather(hour.weatherCode).icon}
                    isDay={hour.isDay}
                    size={26}
                  />
                  <span className="tabular font-mono text-[0.6875rem] text-muted-foreground">
                    {index === 0 ? "MAINT." : formatTime(hour.time)}
                  </span>
                  <span
                    className={`tabular font-mono text-[0.6875rem] ${
                      hour.precipitationProbability >= 30 ? "text-primary" : "text-transparent"
                    }`}
                  >
                    {hour.precipitationProbability}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
