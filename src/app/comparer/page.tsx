/**
 * Page du comparateur de villes (`/comparer`).
 *
 * Server Component réduit à sa plus simple expression : il porte les métadonnées et
 * l'introduction statique, puis délègue à `<CityComparator />`, dont l'interactivité
 * (sélection, scores, verdict) impose le rendu client.
 */

import type { Metadata } from "next";
import { CityComparator } from "@/components/comparator/CityComparator";

export const metadata: Metadata = {
  title: "Comparateur de villes",
  description:
    "Comparez jusqu'à quatre villes sur sept jours et découvrez laquelle offre la meilleure météo grâce à l'indice de confort.",
};

export default function ComparePage() {
  return (
    <div className="space-y-8">
      <header className="border-b pb-6">
        <p className="field-label">Comparateur</p>

        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Où fera-t-il le plus beau ?
        </h1>

        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
          Mettez jusqu&apos;à quatre villes côte à côte. Chacune reçoit un indice de confort
          sur 100, calculé jour par jour à partir de l&apos;état du ciel, de la température,
          du vent et du risque de pluie — de quoi trancher d&apos;un coup d&apos;œil.
        </p>
      </header>

      <CityComparator />
    </div>
  );
}
