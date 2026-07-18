import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { FavoritesSection } from "@/components/FavoritesSection";
import { HistorySection } from "@/components/HistorySection";
import { TemperatureScaleLegend } from "@/components/TemperatureScaleLegend";
import { cityHref } from "@/lib/format";

const SUGGESTED_CITIES = [
  { name: "Paris", latitude: 48.8566, longitude: 2.3522 },
  { name: "Marseille", latitude: 43.2965, longitude: 5.3698 },
  { name: "Lyon", latitude: 45.7485, longitude: 4.8467 },
  { name: "Tokyo", latitude: 35.6895, longitude: 139.6917 },
  { name: "New York", latitude: 40.7143, longitude: -74.006 },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <p className="field-label">Relevés et prévisions à 7 jours</p>

          <h1 className="mt-3 max-w-xl text-balance font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Le temps qu&apos;il fait, ville par ville.
          </h1>

          <p className="mt-3 max-w-lg text-pretty text-muted-foreground">
            Cherchez une ville pour ouvrir son relevé complet. Gardez celles que vous suivez
            à portée de main, et comparez-les quand il faut choisir où aller.
          </p>

          <div className="mt-7 max-w-xl">
            <SearchBar autoFocus size="lg" showGeolocation />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="field-label mr-1">Essayez</span>
            {SUGGESTED_CITIES.map((city) => (
              <Button key={city.name} asChild variant="outline" size="sm" className="h-7 bg-card px-2.5 text-xs">
                <Link href={cityHref(city)}>{city.name}</Link>
              </Button>
            ))}
          </div>
        </div>

        <TemperatureScaleLegend />
      </section>

      <HistorySection />

      <FavoritesSection />
    </div>
  );
}
