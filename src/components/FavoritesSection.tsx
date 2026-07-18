"use client";

/**
 * Section « Mes favoris » de la page d'accueil.
 *
 * Elle gère les trois états possibles de la liste : en cours de chargement depuis
 * le stockage local, vide, ou peuplée. Distinguer explicitement le premier cas
 * évite d'afficher brièvement le message « aucun favori » à un utilisateur qui en a.
 */

import Link from "next/link";
import { GitCompareArrows, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/lib/favorites";
import { FavoriteCityCard } from "@/components/FavoriteCityCard";

export function FavoritesSection() {
  const { favorites, isLoaded, clearFavorites } = useFavorites();
  const count = favorites.length;

  return (
    <section aria-labelledby="favoris-titre">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <div>
          <h2 id="favoris-titre" className="font-heading text-xl font-semibold">
            Mes favoris
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoaded && count > 0
              ? `${count} ville${count > 1 ? "s" : ""} suivie${count > 1 ? "s" : ""}`
              : "Conservées d'une session à l'autre"}
          </p>
        </div>

        {isLoaded && count > 0 && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="bg-card">
              <Link href="/comparer">
                <GitCompareArrows className="size-4" aria-hidden="true" />
                Comparer
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFavorites}
              className="text-muted-foreground hover:text-destructive"
            >
              Tout effacer
            </Button>
          </div>
        )}
      </div>

      {!isLoaded && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {isLoaded && count === 0 && (
        <div className="rounded-xl border border-dashed bg-card/60 px-6 py-14 text-center">
          <Star className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium">Aucune ville suivie pour le moment.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Recherchez une ville ci-dessus, puis touchez l&apos;étoile sur sa fiche pour la
            retrouver ici à chaque visite.
          </p>
        </div>
      )}

      {isLoaded && count > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((city) => (
            <FavoriteCityCard key={city.id} city={city} />
          ))}
        </div>
      )}
    </section>
  );
}
