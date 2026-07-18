"use client";

import Link from "next/link";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchHistory } from "@/lib/search-history";
import { cityHref, countryFlag } from "@/lib/format";

export function HistorySection() {
  const { history, isLoaded, removeVisit, clearHistory } = useSearchHistory();

  if (!isLoaded || history.length === 0) return null;

  return (
    <section aria-labelledby="historique-titre">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="historique-titre"
          className="field-label flex items-center gap-1.5"
        >
          <Clock className="size-3" aria-hidden="true" />
          Consultées récemment
        </h2>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          Effacer
        </Button>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {history.map((city) => (
          <li key={city.id} className="group relative">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 bg-card pl-2.5 pr-7 text-xs"
            >
              <Link href={cityHref(city)}>
                <span aria-hidden="true">{countryFlag(city.countryCode)}</span>
                {city.name}
              </Link>
            </Button>

            {/*
              Le retrait est un bouton distinct, superposé plutôt qu'imbriqué :
              un <button> à l'intérieur d'un <a> est invalide en HTML et rend le
              lien inutilisable au clavier.
            */}
            <button
              type="button"
              onClick={() => removeVisit(city.id)}
              aria-label={`Retirer ${city.name} de l'historique`}
              className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground opacity-60 transition-colors hover:bg-muted hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
