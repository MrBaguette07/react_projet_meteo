import type { City, FavoriteCity } from "@/lib/types";

const FR = "fr-FR";

export function formatTemperature(value: number): string {
  return `${Math.round(value)}°`;
}

export function formatMeasure(value: number, unit: string, digits = 0): string {
  return `${value.toLocaleString(FR, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${unit}`;
}

export function formatTime(isoString: string): string {
  return new Date(`${isoString}Z`).toLocaleTimeString(FR, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatDayLabel(isoDate: string, index: number): string {
  if (index === 0) return "Aujourd'hui";
  if (index === 1) return "Demain";
  const label = new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(FR, {
    weekday: "long",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatShortDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(FR, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatWindDirection(degrees: number): string {
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  return points[Math.round(degrees / 22.5) % 16];
}

export function describeUvIndex(uv: number): { label: string; tone: Tone } {
  if (uv < 3) return { label: "Faible", tone: "good" };
  if (uv < 6) return { label: "Modéré", tone: "moderate" };
  if (uv < 8) return { label: "Élevé", tone: "high" };
  if (uv < 11) return { label: "Très élevé", tone: "severe" };
  return { label: "Extrême", tone: "severe" };
}

export function describeAqi(aqi: number): { label: string; tone: Tone } {
  if (aqi <= 20) return { label: "Excellente", tone: "good" };
  if (aqi <= 40) return { label: "Bonne", tone: "good" };
  if (aqi <= 60) return { label: "Moyenne", tone: "moderate" };
  if (aqi <= 80) return { label: "Médiocre", tone: "high" };
  if (aqi <= 100) return { label: "Mauvaise", tone: "severe" };
  return { label: "Très mauvaise", tone: "severe" };
}

export type Tone = "good" | "moderate" | "high" | "severe";

export const TONE_CLASSES: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  moderate: "bg-amber-50 text-amber-900 ring-amber-600/20",
  high: "bg-orange-50 text-orange-900 ring-orange-600/25",
  severe: "bg-rose-50 text-rose-900 ring-rose-600/25",
};

export const TONE_FILLS: Record<Tone, string> = {
  good: "bg-emerald-600",
  moderate: "bg-amber-500",
  high: "bg-orange-500",
  severe: "bg-rose-600",
};

export function countryFlag(countryCode: string): string {
  if (countryCode.length !== 2) return "";
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((char) => char.charCodeAt(0) + 127397),
  );
}

const UNKNOWN_VALUE = "-";

export function formatCitySubtitle(city: Pick<City, "admin1" | "country">): string {
  return [city.admin1, city.country]
    .filter((part): part is string => Boolean(part) && part !== UNKNOWN_VALUE)
    .join(", ");
}

export function citySlug(name: string): string {
  return name.trim();
}

export function slugToName(slug: string): string {
  return decodeURIComponent(slug).trim();
}

export function cityHref(city: Pick<City | FavoriteCity, "name" | "latitude" | "longitude">): string {
  const params = new URLSearchParams({
    lat: city.latitude.toFixed(4),
    lon: city.longitude.toFixed(4),
  });
  return `/ville/${encodeURIComponent(citySlug(city.name))}?${params}`;
}
