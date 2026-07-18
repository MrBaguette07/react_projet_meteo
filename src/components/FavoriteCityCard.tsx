"use client";

/**
 * Vignette d'une ville favorite : relevé courant résumé et accès à la fiche.
 *
 * Chaque carte charge sa propre météo via `useCityWeather`, dont le cache partagé
 * garantit qu'une ville présente à la fois dans les favoris et dans le comparateur
 * n'est téléchargée qu'une fois.
 *
 * Le filet coloré en tête de carte reprend la température : la grille des favoris
 * se lit comme une bande de température avant même d'être déchiffrée.
 */

import Link from "next/link";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherIcon } from "@/components/WeatherIcon";
import { useFavorites } from "@/lib/favorites";
import { useCityWeather } from "@/lib/use-city-weather";
import { describeWeather } from "@/lib/weather-codes";
import { temperatureColor, temperatureTextColor } from "@/lib/temperature-scale";
import { cityHref, countryFlag, formatCitySubtitle } from "@/lib/format";
import { Temperature, WindSpeed } from "@/components/units/Measurement";
import type { FavoriteCity } from "@/lib/types";

export function FavoriteCityCard({ city }: { city: FavoriteCity }) {
  const { weather, isLoading, error } = useCityWeather(city.latitude, city.longitude);
  const { removeFavorite } = useFavorites();

  const description = weather ? describeWeather(weather.current.weatherCode) : null;

  return (
    <Card className="group relative gap-0 pt-0 transition-shadow hover:shadow-md">
      {/* Filet de température, ou placeholder neutre pendant le chargement. */}
      <div
        className="h-1 w-full"
        style={{
          backgroundColor: weather ? temperatureColor(weather.current.temperature) : "var(--muted)",
        }}
        aria-hidden="true"
      />

      <Link
        href={cityHref(city)}
        className="rounded-b-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 truncate font-heading text-lg font-semibold">
                <span aria-hidden="true">{countryFlag(city.countryCode)}</span>
                <span className="truncate">{city.name}</span>
              </h3>
              <p className="truncate text-xs text-muted-foreground">{formatCitySubtitle(city)}</p>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            {isLoading && (
              <>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="size-12 rounded-full" />
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {weather && description && (
              <>
                <div className="min-w-0">
                  <p
                    className="tabular font-heading text-4xl font-semibold leading-none"
                    style={{ color: temperatureTextColor(weather.current.temperature) }}
                  >
                    <Temperature celsius={weather.current.temperature} />
                  </p>
                  <p className="mt-1.5 truncate text-sm text-muted-foreground">
                    {description.label}
                  </p>
                </div>
                <WeatherIcon
                  name={description.icon}
                  isDay={weather.current.isDay}
                  size={50}
                  className="shrink-0"
                />
              </>
            )}
          </div>

          {weather && (
            <dl className="tabular mt-4 flex gap-5 border-t pt-2.5 font-mono text-[0.6875rem] text-muted-foreground">
              <div className="flex gap-1.5">
                <dt className="uppercase tracking-[0.1em]">Min/Max</dt>
                <dd className="font-medium text-foreground">
                  <Temperature celsius={weather.daily[0].temperatureMin} />/
                  <Temperature celsius={weather.daily[0].temperatureMax} />
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="uppercase tracking-[0.1em]">Vent</dt>
                <dd className="font-medium text-foreground">
                  <WindSpeed kilometersPerHour={weather.current.windSpeed} />
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Link>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => removeFavorite(city.id)}
        aria-label={`Retirer ${city.name} des favoris`}
        title="Retirer des favoris"
        className="absolute right-2 top-3 size-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </Card>
  );
}
