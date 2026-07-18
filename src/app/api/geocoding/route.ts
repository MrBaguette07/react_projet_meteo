import { NextResponse } from "next/server";
import { OpenMeteoError, searchCities } from "@/lib/api/open-meteo";
import type { City } from "@/lib/types";

export interface GeocodingApiResponse {
  results: City[];
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const results = await searchCities(query);
    return NextResponse.json<GeocodingApiResponse>(
      { results },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    const status = error instanceof OpenMeteoError ? (error.status ?? 502) : 500;
    return NextResponse.json({ error: "Recherche indisponible." }, { status });
  }
}
