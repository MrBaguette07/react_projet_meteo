"use client";

/**
 * Comparateur de villes - la fonctionnalité originale de l'application.
 *
 * Chaque ville sélectionnée reçoit un **indice de confort sur 100**, calculé par
 * `computeComfortScore()` à partir de l'état du ciel, de la température, du vent
 * et du risque de pluie sur sept jours. Le comparateur désigne ensuite la ville
 * offrant la meilleure moyenne : là où les applications météo classiques laissent
 * l'utilisateur interpréter des chiffres bruts, celle-ci répond directement à la
 * question « où fera-t-il le plus beau cette semaine ? ».
 *
 * La sélection est persistée dans le `sessionStorage` : revenir depuis une fiche
 * ville ne la perd pas, mais elle n'encombre pas le stockage à long terme, réservé
 * aux favoris.
 */

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Plus, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { ComparisonColumn, type CityScore } from "@/components/comparator/ComparisonColumn";
import { useFavorites } from "@/lib/favorites";
import { createStorageStore } from "@/lib/storage-store";
import { countryFlag } from "@/lib/format";
import type { City, FavoriteCity } from "@/lib/types";

/** Au-delà de quatre colonnes, la grille devient illisible sur un écran d'ordinateur. */
const MAX_CITIES = 4;

/** Instantané serveur et valeur de repli - constante partagée, donc stable. */
const NO_CITIES: City[] = [];

/** Valide la sélection restaurée : une entrée corrompue est simplement ignorée. */
function parseSelection(raw: string): City[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return NO_CITIES;

  const valid = parsed.filter((item): item is City => {
    if (typeof item !== "object" || item === null) return false;
    const candidate = item as Partial<City>;
    return (
      typeof candidate.id === "number" &&
      typeof candidate.name === "string" &&
      typeof candidate.latitude === "number" &&
      typeof candidate.longitude === "number"
    );
  });

  return valid.length > 0 ? valid.slice(0, MAX_CITIES) : NO_CITIES;
}

const selectionStore = createStorageStore<City[]>({
  key: "meteo-app:comparison:v1",
  area: "session",
  parse: parseSelection,
  fallback: NO_CITIES,
});

/** Convertit un favori en `City` pour l'ajouter au comparatif. */
function favoriteToCity(favorite: FavoriteCity): City {
  return {
    id: favorite.id,
    name: favorite.name,
    country: favorite.country,
    countryCode: favorite.countryCode,
    admin1: favorite.admin1,
    latitude: favorite.latitude,
    longitude: favorite.longitude,
    timezone: favorite.timezone,
  };
}

export function CityComparator() {
  const { favorites, isLoaded } = useFavorites();

  const cities = useSyncExternalStore(
    selectionStore.subscribe,
    selectionStore.getSnapshot,
    selectionStore.getServerSnapshot,
  );

  /** Scores remontés par chaque colonne, indexés par identifiant de ville. */
  const [scores, setScores] = useState<Record<number, CityScore | null>>({});

  const addCity = useCallback((city: City) => {
    const current = selectionStore.getSnapshot();
    if (current.length >= MAX_CITIES) return;
    if (current.some((existing) => existing.id === city.id)) return;
    selectionStore.set([...current, city]);
  }, []);

  const removeCity = useCallback((cityId: number) => {
    selectionStore.set(selectionStore.getSnapshot().filter((city) => city.id !== cityId));
  }, []);

  // `useCallback` est indispensable ici : cette fonction est une dépendance de
  // l'effet de chaque colonne, et une nouvelle référence à chaque rendu
  // provoquerait une boucle de mises à jour.
  const handleScored = useCallback((cityId: number, score: CityScore | null) => {
    setScores((current) => {
      if (current[cityId] === score) return current;
      return { ...current, [cityId]: score };
    });
  }, []);

  /** Ville en tête du comparatif ; `null` tant que toutes les colonnes ne sont pas chargées. */
  const winnerId = useMemo(() => {
    const ranked = cities
      .map((city) => scores[city.id])
      .filter((score): score is CityScore => score != null);

    // On attend d'avoir toutes les données, et au moins deux villes : désigner un
    // gagnant sur un comparatif incomplet serait trompeur.
    if (ranked.length < 2 || ranked.length !== cities.length) return null;

    const best = ranked.reduce((leader, score) =>
      score.averageScore > leader.averageScore ? score : leader,
    );

    // Égalité parfaite entre toutes les villes : aucun gagnant à mettre en avant.
    const isTie = ranked.every((score) => score.averageScore === best.averageScore);
    return isTie ? null : best.cityId;
  }, [cities, scores]);

  const winner = cities.find((city) => city.id === winnerId) ?? null;

  /** Favoris pas encore présents dans le comparatif, proposés en ajout rapide. */
  const suggestibleFavorites = favorites.filter(
    (favorite) => !cities.some((city) => city.id === favorite.id),
  );

  const isFull = cities.length >= MAX_CITIES;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              {isFull ? (
                <p className="rounded-md border border-dashed px-4 py-2.5 text-sm text-muted-foreground">
                  Maximum de {MAX_CITIES} villes atteint - retirez-en une pour en ajouter une autre.
                </p>
              ) : (
                <SearchBar onSelect={addCity} placeholder="Ajouter une ville au comparatif…" />
              )}
            </div>

            <p className="tabular shrink-0 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {cities.length}/{MAX_CITIES} villes
            </p>
          </div>

          {isLoaded && suggestibleFavorites.length > 0 && !isFull && (
            <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
              <span className="field-label mr-1">Depuis vos favoris</span>
              {suggestibleFavorites.map((favorite) => (
                <Button
                  key={favorite.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addCity(favoriteToCity(favorite))}
                  className="h-7 px-2.5 text-xs"
                >
                  <Plus className="size-3" aria-hidden="true" />
                  <span aria-hidden="true">{countryFlag(favorite.countryCode)}</span>
                  {favorite.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verdict : annoncé aux lecteurs d'écran dès qu'il change. */}
      {winner && (
        <p
          role="status"
          className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-lg border border-emerald-600/25 bg-emerald-50/70 px-5 py-3.5 text-center text-sm"
        >
          <Trophy className="size-4 text-emerald-700" aria-hidden="true" />
          <span aria-hidden="true">{countryFlag(winner.countryCode)}</span>
          <strong className="font-heading text-base font-semibold text-emerald-900">
            {winner.name}
          </strong>
          <span className="text-emerald-900/80">
            offre la meilleure météo des sept prochains jours, avec un indice de confort de{" "}
            <strong className="tabular font-semibold">{scores[winner.id]?.averageScore}/100</strong>.
          </span>
        </p>
      )}

      {cities.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/60 px-6 py-20 text-center">
          <p className="font-heading text-lg font-semibold">
            Sélectionnez au moins deux villes à comparer.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            L&apos;indice de confort agrège l&apos;état du ciel, la température, le vent et le
            risque de pluie sur sept jours pour désigner la destination la plus agréable.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:grid-cols-2 ${
            cities.length >= 3 ? "lg:grid-cols-3 xl:grid-cols-4" : ""
          }`}
        >
          {cities.map((city) => (
            <ComparisonColumn
              key={city.id}
              city={city}
              isWinner={city.id === winnerId}
              onRemove={removeCity}
              onScored={handleScored}
            />
          ))}
        </div>
      )}
    </div>
  );
}
