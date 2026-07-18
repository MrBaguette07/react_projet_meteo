/**
 * Layout racine - Server Component intégral.
 *
 * Aucun fournisseur d'état n'est nécessaire : les favoris vivent dans un store
 * externe consommé via `useSyncExternalStore` (voir `src/lib/favorites.ts`). La
 * frontière client est donc repoussée au plus près des composants réellement
 * interactifs, et l'en-tête comme le pied de page n'envoient aucun JavaScript.
 *
 * Trois familles typographiques sont chargées, une par rôle : IBM Plex Sans
 * Condensed pour les titres et les grands relevés, IBM Plex Sans pour le texte
 * courant, IBM Plex Mono pour toutes les données chiffrées et les intitulés de
 * champ. Plex a été dessiné pour des contextes techniques : c'est exactement le
 * registre d'une feuille d'observation météo.
 */

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/SiteHeader";
import { WeatherIconDefs } from "@/components/WeatherIcon";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Météo - relevés, prévisions et comparateur de villes",
    // Les pages de ville complètent ce gabarit (ex. « Lyon - Météo »).
    template: "%s - Météo",
  },
  description:
    "Recherchez une ville, consultez ses conditions actuelles et ses prévisions sur 7 jours, gérez vos favoris et comparez plusieurs destinations.",
};

export const viewport: Viewport = {
  themeColor: "#f4f7fa",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={200}>
          <WeatherIconDefs />
          <SiteHeader />

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </main>

          <footer className="mt-8 border-t bg-card">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
              <p className="font-mono uppercase tracking-[0.12em]">
                Station - projet pédagogique Next.js
              </p>
              <p>
                Données{" "}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  Open-Meteo
                </a>
                {" · "}Fond de carte{" "}
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  OpenStreetMap
                </a>
              </p>
            </div>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
