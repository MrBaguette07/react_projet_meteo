import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/Metric";
import { formatTime } from "@/lib/format";
import type { DailyForecast } from "@/lib/types";

interface SunPathProps {
  day: DailyForecast;
  currentTime: string;
}

function toEpoch(localIsoString: string): number {
  return new Date(`${localIsoString}Z`).getTime();
}

function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.round(milliseconds / 60_000);
  return `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}min`;
}

export function SunPath({ day, currentTime }: SunPathProps) {
  const sunrise = toEpoch(day.sunrise);
  const sunset = toEpoch(day.sunset);
  const now = toEpoch(currentTime);

  const dayLength = Math.max(1, sunset - sunrise);
  const progress = (now - sunrise) / dayLength;
  const isDaylight = progress >= 0 && progress <= 1;

  const t = Math.min(1, Math.max(0, progress));
  const markerX = (1 - t) ** 2 * 10 + 2 * (1 - t) * t * 100 + t ** 2 * 190;
  const markerY = (1 - t) ** 2 * 60 + 2 * (1 - t) * t * -12 + t ** 2 * 60;

  return (
    <Card>
      <CardContent>
        <SectionHeading
          aside={
            <span className="tabular font-mono text-xs text-muted-foreground">
              {formatDuration(dayLength)} de jour
            </span>
          }
        >
          Course du soleil
        </SectionHeading>

        <svg viewBox="0 0 200 74" className="mt-3 w-full" role="presentation" aria-hidden="true">
          <defs>
            <linearGradient id="sunArc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.72 0.13 75)" stopOpacity="0.15" />
              <stop offset="50%" stopColor="oklch(0.72 0.13 75)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.64 0.16 45)" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Ligne d'horizon. */}
          <line x1="0" y1="60" x2="200" y2="60" stroke="var(--border)" strokeWidth="1" />
          <path
            d="M10 60 Q100 -12 190 60"
            fill="none"
            stroke="url(#sunArc)"
            strokeWidth="2"
            strokeDasharray="3 4"
          />

          {isDaylight && (
            <g>
              <circle cx={markerX} cy={markerY} r="9" fill="oklch(0.72 0.13 75)" opacity="0.22" />
              <circle cx={markerX} cy={markerY} r="4.5" fill="oklch(0.68 0.15 60)" />
            </g>
          )}
        </svg>

        <dl className="mt-1 flex justify-between border-t pt-3">
          <div>
            <dt className="field-label">Lever</dt>
            <dd className="tabular mt-1 font-heading text-lg font-semibold">
              {formatTime(day.sunrise)}
            </dd>
          </div>
          <div className="text-right">
            <dt className="field-label">Coucher</dt>
            <dd className="tabular mt-1 font-heading text-lg font-semibold">
              {formatTime(day.sunset)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
