import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/Metric";
import type { City } from "@/lib/types";

const BBOX_DELTA = 0.1;

export function CityMap({ city }: { city: City }) {
  const bbox = [
    city.longitude - BBOX_DELTA,
    city.latitude - BBOX_DELTA / 2,
    city.longitude + BBOX_DELTA,
    city.latitude + BBOX_DELTA / 2,
  ]
    .map((value) => value.toFixed(4))
    .join(",");

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${city.latitude},${city.longitude}`;
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${city.latitude}&mlon=${city.longitude}#map=11/${city.latitude}/${city.longitude}`;

  return (
    <Card className="gap-0">
      <CardContent>
        <SectionHeading
          aside={
            <span className="tabular font-mono text-xs text-muted-foreground">
              {city.latitude.toFixed(3)}, {city.longitude.toFixed(3)}
            </span>
          }
        >
          Localisation
        </SectionHeading>
      </CardContent>

      <iframe
        src={embedUrl}
        title={`Carte de ${city.name}`}
        loading="lazy"
        className="mt-3 h-60 w-full border-y"
      />

      <CardContent className="flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
        {/* « auto » est la valeur de repli envoyée à l'API, pas un fuseau : on ne
            l'affiche pas comme s'il s'agissait d'une donnée réelle. */}
        <span className="tabular font-mono">
          {[
            city.elevation !== undefined ? `ALT ${Math.round(city.elevation)} m` : null,
            city.timezone !== "auto" ? city.timezone : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <a
          href={fullMapUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Voir en grand
        </a>
      </CardContent>
    </Card>
  );
}
