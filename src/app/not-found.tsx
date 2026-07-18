/**
 * Page 404 globale, servie pour toute URL ne correspondant à aucune route.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="tabular font-mono text-5xl font-medium text-muted-foreground/50">404</p>

      <h1 className="mt-4 font-heading text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cette adresse ne correspond à aucune page de l&apos;application.
      </p>

      <div className="mt-7 text-left">
        <SearchBar placeholder="Rechercher une ville…" />
      </div>

      <Button asChild variant="ghost" className="mt-5">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
