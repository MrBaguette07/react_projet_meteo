"use client";

/**
 * Frontière d'erreur de la page de détail.
 *
 * Un `error.tsx` est nécessairement un Client Component : il doit exposer `reset()`,
 * qui retente le rendu du segment sans recharger toute l'application. C'est la
 * bonne réponse à une panne temporaire de l'API météo.
 */

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CityError({ error, reset }: ErrorProps) {
  // Journalisé côté client pour faciliter le diagnostic ; en production, ce point
  // d'accroche est celui où brancher un service de suivi d'erreurs.
  useEffect(() => {
    console.error("Échec du chargement de la page ville :", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16">
      <Alert variant="destructive" className="bg-card">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle className="font-heading">Relevé indisponible</AlertTitle>
        <AlertDescription>
          {error.message || "Le service météo n'a pas répondu. Cela peut être temporaire."}
        </AlertDescription>
      </Alert>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          <RotateCw className="size-4" aria-hidden="true" />
          Réessayer
        </Button>
        <Button asChild variant="outline" className="bg-card">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
