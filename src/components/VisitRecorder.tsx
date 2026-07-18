"use client";

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
