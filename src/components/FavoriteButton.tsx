"use client";

/**
 * Bouton d'ajout/retrait des favoris, décliné en deux variantes.
 *
 * Il reçoit la `City` complète en props depuis un Server Component : c'est le seul
 * élément interactif de l'en-tête de la page de détail, le reste du rendu demeure
 * côté serveur.
 */

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import type { City } from "@/lib/types";

interface FavoriteButtonProps {
  city: City;
  /** `full` affiche un bouton avec libellé, `icon` une simple étoile. */
  variant?: "full" | "icon";
  className?: string;
}

export function FavoriteButton({ city, variant = "full", className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const active = isFavorite(city.id);

  // Tant que le stockage local n'est pas lu, l'état favori est inconnu : on rend un
  // bouton désactivé de même gabarit pour éviter tout saut de mise en page.
  const disabled = !isLoaded;

  const star = (
    <Star
      className={cn("size-4", active && "fill-amber-400 text-amber-500")}
      aria-hidden="true"
    />
  );

  if (variant === "icon") {
    const label = active ? `Retirer ${city.name} des favoris` : `Ajouter ${city.name} aux favoris`;
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => toggleFavorite(city)}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        title={label}
        className={cn("size-8 bg-card", className)}
      >
        {star}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      onClick={() => toggleFavorite(city)}
      disabled={disabled}
      aria-pressed={active}
      className={cn("bg-card", active && "bg-amber-50 text-amber-900 hover:bg-amber-100", className)}
    >
      {star}
      {active ? "Dans les favoris" : "Ajouter aux favoris"}
    </Button>
  );
}
