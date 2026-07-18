import { NextResponse } from "next/server";
import { OpenMeteoError, reverseGeocode } from "@/lib/api/open-meteo";
import type { City } from "@/lib/types";

export interface ReverseGeocodingApiResponse {
  city: City;
}

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
    const city = await reverseGeocode(latitude, longitude);

    if (!city) {
      return NextResponse.json(
        { error: "Aucune ville identifiée à cette position." },
        { status: 404 },
      );
    }

    return NextResponse.json<ReverseGeocodingApiResponse>(
      { city },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    const status = error instanceof OpenMeteoError ? (error.status ?? 502) : 500;
    return NextResponse.json({ error: "Localisation indisponible." }, { status });
  }
}
