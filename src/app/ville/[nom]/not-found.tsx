import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";

export default function CityNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-lg border bg-card">
        <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
      </span>

      <h1 className="mt-5 font-heading text-2xl font-bold">Ville introuvable</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Aucune ville de ce nom dans la base de géocodage. Vérifiez l&apos;orthographe ou
        essayez une autre commune.
      </p>

      <div className="mt-7 text-left">
        <SearchBar autoFocus placeholder="Rechercher une ville…" />
      </div>

      <Button asChild variant="ghost" className="mt-5">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
