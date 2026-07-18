import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAirQuality, getWeather, resolveCity } from "@/lib/api/open-meteo";
import { slugToName } from "@/lib/format";
import type { City } from "@/lib/types";
import { CurrentConditions } from "@/components/CurrentConditions";
import { HourlyStrip } from "@/components/HourlyStrip";
import { DailyForecastList } from "@/components/DailyForecastList";
import { SunPath } from "@/components/SunPath";
import { AirQualityCard } from "@/components/AirQualityCard";
import { CityMap } from "@/components/CityMap";
import { CityHeader } from "@/components/CityHeader";
import { VisitRecorder } from "@/components/VisitRecorder";

interface PageProps {
  params: Promise<{ nom: string }>;
  searchParams: Promise<{ lat?: string; lon?: string }>;
}

async function resolveCityFromRoute(nom: string, lat?: string, lon?: string): Promise<City | null> {
  const name = slugToName(nom);
  const city = await resolveCity(name);

  const latitude = Number(lat);
  const longitude = Number(lon);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  if (!hasCoordinates) return city;

  const matchesCoordinates =
    city !== null &&
    Math.abs(city.latitude - latitude) < 0.5 &&
    Math.abs(city.longitude - longitude) < 0.5;

  if (matchesCoordinates) return city;

  return {
    id: Math.round(latitude * 1000) * 100000 + Math.round(longitude * 1000),
    name,
    country: city?.country ?? "-",
    countryCode: city?.countryCode ?? "",
    latitude,
    longitude,
    timezone: "auto",
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nom } = await params;
  const name = slugToName(nom);
  return {
    title: name,
    description: `Conditions actuelles et prévisions sur 7 jours pour ${name}.`,
  };
}

export default async function CityPage({ params, searchParams }: PageProps) {
  const [{ nom }, { lat, lon }] = await Promise.all([params, searchParams]);

  const city = await resolveCityFromRoute(nom, lat, lon);
  if (!city) notFound();

  const [weather, airQuality] = await Promise.all([
    getWeather(city.latitude, city.longitude, city.timezone),
    getAirQuality(city.latitude, city.longitude),
  ]);

  const today = weather.daily[0];

  return (
    <div className="space-y-6">
      {/* Sans rendu : enregistre la consultation dans l'historique côté client. */}
      <VisitRecorder city={city} />

      <CityHeader city={city} />

      <CurrentConditions
        current={weather.current}
        uvIndex={weather.currentUvIndex}
        temperatureMin={today.temperatureMin}
        temperatureMax={today.temperatureMax}
      />

      <HourlyStrip hours={weather.hourly} />

      {/* `items-start` empêche la liste des prévisions de s'étirer sur toute la
          hauteur de la colonne latérale, qui est nettement plus haute. */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <DailyForecastList days={weather.daily} />

        <div className="space-y-6">
          <SunPath day={today} currentTime={weather.current.time} />
          {airQuality && <AirQualityCard airQuality={airQuality} />}
          <CityMap city={city} />
        </div>
      </div>
    </div>
  );
}
