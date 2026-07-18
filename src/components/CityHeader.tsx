/**
 * En-tête de la page de détail : identité de la ville, bouton favori, recherche.
 *
 * Server Component qui compose deux Client Components (`FavoriteButton`, `SearchBar`).
 * Le titre et le fil d'Ariane restent donc rendus côté serveur.
 */

import Link from "next/link";
import { ChevronRight, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SearchBar } from "@/components/SearchBar";
import { countryFlag, formatCitySubtitle } from "@/lib/format";
import type { City } from "@/lib/types";

export function CityHeader({ city }: { city: City }) {
  return (
    <header className="space-y-5">
      <nav aria-label="Fil d'Ariane">
        <ol className="flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">
              Relevés
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3" />
          </li>
          <li className="text-foreground">{city.name}</li>
        </ol>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            <span aria-hidden="true">{countryFlag(city.countryCode)}</span>
            <span className="truncate">{city.name}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatCitySubtitle(city)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <FavoriteButton city={city} />
          <Button asChild variant="outline" className="bg-card">
            <Link href="/comparer">
              <GitCompareArrows className="size-4" aria-hidden="true" />
              Comparer
            </Link>
          </Button>
        </div>
      </div>

      <SearchBar placeholder="Chercher une autre ville…" className="max-w-sm" />
    </header>
  );
}
