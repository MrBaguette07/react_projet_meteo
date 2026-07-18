/**
 * Prévisions sur 7 jours.
 *
 * Chaque ligne porte une barre de température positionnée sur l'amplitude
 * **globale de la semaine** : une journée fraîche et une journée chaude sont donc
 * directement comparables à l'œil, ce qu'un affichage purement numérique ne permet pas.
 *
 * La barre est elle-même dégradée de la couleur du minimum à celle du maximum :
 * sa longueur donne l'amplitude, sa teinte donne le niveau.
 */

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/Metric";
import { WeatherIcon } from "@/components/WeatherIcon";
import { describeWeather } from "@/lib/weather-codes";
import { temperatureColor } from "@/lib/temperature-scale";
import { formatDayLabel, formatShortDate, formatTemperature } from "@/lib/format";
import type { DailyForecast } from "@/lib/types";

export function DailyForecastList({ days }: { days: DailyForecast[] }) {
  const weekMin = Math.min(...days.map((day) => day.temperatureMin));
  const weekMax = Math.max(...days.map((day) => day.temperatureMax));
  const weekRange = Math.max(1, weekMax - weekMin);

  return (
    <Card>
      <CardContent>
        <SectionHeading
          aside={
            <span className="tabular font-mono text-xs text-muted-foreground">
              {formatTemperature(weekMin)} → {formatTemperature(weekMax)}
            </span>
          }
        >
          Prévisions 7 jours
        </SectionHeading>

        <ul className="mt-2 divide-y">
          {days.map((day, index) => {
            const offsetPercent = ((day.temperatureMin - weekMin) / weekRange) * 100;
            const widthPercent = ((day.temperatureMax - day.temperatureMin) / weekRange) * 100;
            const description = describeWeather(day.weatherCode);

            return (
              <li key={day.date} className="flex items-center gap-3 py-3 sm:gap-4">
                <div className="w-24 shrink-0 sm:w-32">
                  <p className="truncate font-heading text-sm font-semibold">
                    {formatDayLabel(day.date, index)}
                  </p>
                  <p className="tabular font-mono text-[0.6875rem] text-muted-foreground">
                    {formatShortDate(day.date)}
                  </p>
                </div>

                <WeatherIcon name={description.icon} size={30} className="shrink-0" />

                <div className="hidden min-w-0 flex-1 sm:block">
                  <p className="truncate text-sm">{description.label}</p>
                  {day.precipitationProbabilityMax > 0 && (
                    <p className="tabular font-mono text-[0.6875rem] text-primary">
                      {day.precipitationProbabilityMax}% de pluie
                    </p>
                  )}
                </div>

                <div className="flex flex-1 items-center gap-2.5 sm:flex-none sm:gap-3">
                  <span className="tabular w-9 text-right text-sm text-muted-foreground">
                    {formatTemperature(day.temperatureMin)}
                  </span>
                  <span
                    className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted sm:w-32 sm:flex-none"
                    aria-hidden="true"
                  >
                    <span
                      className="absolute inset-y-0 rounded-full"
                      style={{
                        left: `${offsetPercent}%`,
                        // Largeur minimale de 6 % pour qu'une journée à amplitude
                        // quasi nulle reste visible sur la barre.
                        width: `${Math.max(6, widthPercent)}%`,
                        backgroundImage: `linear-gradient(to right, ${temperatureColor(day.temperatureMin)}, ${temperatureColor(day.temperatureMax)})`,
                      }}
                    />
                  </span>
                  <span className="tabular w-9 font-heading text-sm font-semibold">
                    {formatTemperature(day.temperatureMax)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
