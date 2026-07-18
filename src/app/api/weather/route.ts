/**
 * Route Handler météo : `GET /api/weather?lat=48.85&lon=2.35`
 *
 * Les favoris vivent dans le `localStorage` : le serveur ne les connaît pas et ne
 * peut donc pas pré-rendre leurs vignettes. Cette route permet au composant client
 * de récupérer la météo tout en **réutilisant le cache serveur** — deux visiteurs
 * ayant Paris en favori ne déclenchent qu'un seul appel à Open-Meteo.
 */

import { NextResponse } from "next/server";
import { getWeather, OpenMeteoError } from "@/lib/api/open-meteo";
import type { WeatherBundle } from "@/lib/types";

export type WeatherApiResponse = WeatherBundle;

/** Valide une coordonnée : nombre fini et dans les bornes géographiques. */
function parseCoordinate(raw: string | null, max: number): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && Math.abs(value) <= max ? value : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = parseCoordinate(params.get("lat"), 90);
  const longitude = parseCoordinate(params.get("lon"), 180);

  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: "Coordonnées invalides." }, { status: 400 });
  }

  try {
    const weather = await getWeather(latitude, longitude);
    return NextResponse.json<WeatherApiResponse>(weather, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" },
    });
  } catch (error) {
    const status = error instanceof OpenMeteoError ? (error.status ?? 502) : 500;
    return NextResponse.json({ error: "Météo indisponible." }, { status });
  }
}
