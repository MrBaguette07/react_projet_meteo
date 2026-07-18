/**
 * Route Handler d'auto-complétion : `GET /api/geocoding?q=par`
 *
 * La barre de recherche est un Client Component et ne peut donc pas appeler
 * directement `searchCities()` (fonction serveur). Ce proxy sert d'intermédiaire
 * et apporte deux bénéfices :
 *
 *  - les réponses transitent par le cache serveur de Next.js, ce qui **dédoublonne**
 *    les frappes identiques de tous les visiteurs plutôt qu'un cache par navigateur ;
 *  - le contrat exposé au client est notre type `City`, indépendant du format
 *    d'Open-Meteo.
 */

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
          // Le navigateur peut réutiliser la réponse pendant une minute : cela
          // absorbe les allers-retours d'un utilisateur qui corrige sa saisie.
          "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    const status = error instanceof OpenMeteoError ? (error.status ?? 502) : 500;
    return NextResponse.json({ error: "Recherche indisponible." }, { status });
  }
}
