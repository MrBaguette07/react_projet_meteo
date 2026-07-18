import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/Metric";
import { Badge } from "@/components/ui/badge";
import { describeAqi, formatMeasure, TONE_CLASSES } from "@/lib/format";
import type { AirQuality } from "@/lib/types";

const AQI_SCALE_MAX = 100;

export function AirQualityCard({ airQuality }: { airQuality: AirQuality }) {
  const { label, tone } = describeAqi(airQuality.europeanAqi);
  const fillPercent = Math.min(100, (airQuality.europeanAqi / AQI_SCALE_MAX) * 100);

  const rows = [
    { label: "PM2,5", value: formatMeasure(airQuality.pm2_5, "µg/m³", 1) },
    { label: "PM10", value: formatMeasure(airQuality.pm10, "µg/m³", 1) },
    { label: "NO₂", value: formatMeasure(airQuality.nitrogenDioxide, "µg/m³", 1) },
    { label: "Ozone", value: formatMeasure(airQuality.ozone, "µg/m³", 1) },
    ...(airQuality.pollen !== undefined
      ? [{ label: "Pollens", value: formatMeasure(airQuality.pollen, "grains/m³") }]
      : []),
  ];

  return (
    <Card>
      <CardContent>
        <SectionHeading
          aside={
            <Badge variant="outline" className={`border-0 ring-1 ${TONE_CLASSES[tone]}`}>
              {label}
            </Badge>
          }
        >
          Qualité de l&apos;air
        </SectionHeading>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="tabular font-heading text-4xl font-semibold leading-none">
            {Math.round(airQuality.europeanAqi)}
          </span>
          <span className="text-sm text-muted-foreground">indice européen</span>
        </div>

        {/* Position du curseur sur l'échelle plutôt qu'un simple remplissage :
            l'utilisateur situe la valeur dans la gamme complète, pas seulement
            sa progression depuis zéro. */}
        <div className="relative mt-3 h-1.5 rounded-full bg-linear-to-r from-emerald-500 via-amber-400 to-rose-500">
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground shadow-sm"
            style={{ left: `${fillPercent}%` }}
            aria-hidden="true"
          />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2 border-t pt-2">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="tabular font-mono text-xs font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
