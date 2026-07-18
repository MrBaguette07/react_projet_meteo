"use client";

/**
 * Enregistre la consultation d'une ville dans l'historique.
 *
 * Composant sans rendu : il n'existe que pour son effet de bord. C'est ce qui
 * permet à `/ville/[nom]`, un Server Component, d'alimenter un historique qui vit
 * dans le `localStorage` — sans devoir basculer la page entière côté client.
 *
 * L'effet ne dépend que de l'identifiant : naviguer d'une ville à l'autre
 * enregistre bien chaque visite, mais un re-rendu de la même page n'écrit rien.
 */

import { useEffect } from "react";
import { recordVisit } from "@/lib/search-history";
import type { City } from "@/lib/types";

export function VisitRecorder({ city }: { city: City }) {
  useEffect(() => {
    recordVisit(city);
    // `city` est volontairement absent des dépendances : l'objet est recréé à
    // chaque rendu du serveur, et le suivre relancerait l'effet inutilement.
    // L'identifiant suffit à distinguer deux villes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id]);

  return null;
}
