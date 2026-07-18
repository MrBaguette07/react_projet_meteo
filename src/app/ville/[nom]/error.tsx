"use client";

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
