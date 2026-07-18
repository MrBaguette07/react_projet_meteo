"use client";

/**
 * Colonne du comparateur : une ville, son relevé courant et son indice de confort
 * jour par jour.
 *
 * Le composant reste autonome — il déclenche lui-même son chargement — pour que
 * l'ajout d'une ville n'oblige pas à recharger les colonnes déjà affichées.
 */

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowRight, Trophy, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WeatherIcon } from "@/components/WeatherIcon";
import { useCityWeather } from "@/lib/use-city-weather";
import { computeComfortScore, describeWeather } from "@/lib/weather-codes";
import { temperatureTextColor } from "@/lib/temperature-scale";
import {
  cityHref,
  countryFlag,
  formatDayLabel,
  formatMeasure,
  formatTemperature,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { City } from "@/lib/types";

/** Indice de confort d'une ville, remonté au parent pour établir le verdict. */
export interface CityScore {
  cityId: number;
  /** Moyenne des scores journaliers, sur 100. */
  averageScore: number;
  /** Score de chaque jour, dans l'ordre des prévisions. */
  dailyScores: number[];
}

interface ComparisonColumnProps {
  city: City;
  /** `true` si cette ville obtient la meilleure moyenne du comparatif. */
  isWinner: boolean;
  onRemove: (cityId: number) => void;
  /** Remonte les scores calculés ; `null` tant que la météo n'est pas chargée. */
  onScored: (cityId: number, score: CityScore | null) => void;
}

/** Couleur de la barre de score, sur la même échelle qualitative que le reste. */
function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-lime-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-rose-500";
}

export function ComparisonColumn({ city, isWinner, onRemove, onScored }: ComparisonColumnProps) {
  const { weather, isLoading, error } = useCityWeather(city.latitude, city.longitude);

  // Les scores sont dérivés de la météo une seule fois : l'histogramme ci-dessous
  // et le verdict remonté au parent s'appuient sur exactement les mêmes valeurs.
  const score = useMemo<CityScore | null>(() => {
    if (!weather) return null;

    const dailyScores = weather.daily.map((day) =>
      computeComfortScore({
        weatherCode: day.weatherCode,
        // La moyenne min/max représente mieux la journée vécue que le seul maximum.
        temperature: (day.temperatureMax + day.temperatureMin) / 2,
        windSpeed: day.windSpeedMax,
        precipitationProbability: day.precipitationProbabilityMax,
      }),
    );

    return {
      cityId: city.id,
      dailyScores,
      averageScore: Math.round(
        dailyScores.reduce((sum, value) => sum + value, 0) / dailyScores.length,
      ),
    };
  }, [weather, city.id]);

  // Remontée au parent, et invalidation au démontage pour qu'une ville retirée
  // ne continue pas de peser dans le verdict.
  useEffect(() => {
    onScored(city.id, score);
    return () => onScored(city.id, null);
  }, [score, city.id, onScored]);

  const description = weather ? describeWeather(weather.current.weatherCode) : null;

  return (
    <Card
      className={cn(
        "gap-0 transition-colors",
        isWinner && "ring-2 ring-emerald-600/40",
      )}
    >
      <CardContent className="pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate font-heading text-lg font-semibold">
              <span aria-hidden="true">{countryFlag(city.countryCode)}</span>
              <span className="truncate">{city.name}</span>
            </h3>
            <p className="truncate text-xs text-muted-foreground">{city.country}</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(city.id)}
            aria-label={`Retirer ${city.name} de la comparaison`}
            className="-mr-1 size-7 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Emplacement réservé même sans badge : sans cela, la colonne gagnante
            serait décalée vers le bas et les températures ne s'aligneraient plus. */}
        <div className="mt-2.5 h-6">
          {isWinner && (
            <Badge className="border-0 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/25">
              <Trophy className="size-3" aria-hidden="true" />
              Meilleure météo
            </Badge>
          )}
        </div>

        {isLoading && (
          <div className="mt-4 space-y-3" aria-hidden="true">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        {weather && description && score && (
          <>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p
                  className="tabular font-heading text-4xl font-semibold leading-none"
                  style={{ color: temperatureTextColor(weather.current.temperature) }}
                >
                  {formatTemperature(weather.current.temperature)}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{description.label}</p>
              </div>
              <WeatherIcon name={description.icon} isDay={weather.current.isDay} size={54} />
            </div>

            <dl className="mt-4 space-y-0 text-sm">
              {[
                { label: "Ressenti", value: formatTemperature(weather.current.apparentTemperature) },
                { label: "Humidité", value: formatMeasure(weather.current.humidity, "%") },
                { label: "Vent", value: formatMeasure(weather.current.windSpeed, "km/h") },
                {
                  label: "Pluie 7 j",
                  value: formatMeasure(
                    weather.daily.reduce((sum, day) => sum + day.precipitationSum, 0),
                    "mm",
                    1,
                  ),
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-2 border-t py-1.5">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="tabular font-mono text-xs font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 border-t pt-3">
              <div className="flex items-baseline justify-between">
                <span className="field-label">Indice de confort</span>
                <span className="tabular font-heading text-2xl font-semibold">
                  {score.averageScore}
                  <span className="text-sm font-medium text-muted-foreground">/100</span>
                </span>
              </div>

              {/* Histogramme des 7 prochains jours : la hauteur code le score. */}
              <ul className="mt-3 flex h-16 items-end gap-1">
                {weather.daily.map((day, index) => (
                  <li key={day.date} className="flex h-full flex-1 items-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "block w-full cursor-default rounded-t-sm",
                            scoreColor(score.dailyScores[index]),
                          )}
                          style={{
                            height: `${Math.max(8, (score.dailyScores[index] / 100) * 64)}px`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDayLabel(day.date, index)} · {score.dailyScores[index]}/100
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
              <p className="field-label mt-2">7 prochains jours</p>
            </div>
          </>
        )}

        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href={cityHref(city)}>
            Voir le relevé
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
