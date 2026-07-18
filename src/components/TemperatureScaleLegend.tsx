/**
 * Légende de l'échelle chromatique de température.
 *
 * Toute l'interface encode la température par la couleur ; cette bande en donne
 * la clé, une fois, à l'endroit où l'utilisateur commence sa lecture. Elle a le
 * statut d'une légende de carte : sans elle, le code couleur resterait implicite.
 *
 * Server Component — le dégradé est calculé au rendu, rien n'est envoyé au client.
 */

import { SCALE_TICKS, temperatureGradient } from "@/lib/temperature-scale";

export function TemperatureScaleLegend() {
  const min = SCALE_TICKS[0];
  const max = SCALE_TICKS[SCALE_TICKS.length - 1];

  return (
    <figure className="w-full">
      <figcaption className="field-label mb-2">Échelle de température</figcaption>

      <div
        className="h-2 w-full rounded-full"
        style={{ backgroundImage: temperatureGradient() }}
        role="img"
        aria-label={`Échelle de couleur allant de ${min} à ${max} degrés Celsius, du bleu pour le froid au rouge pour le chaud.`}
      />

      <div className="relative mt-1.5 h-4" aria-hidden="true">
        {SCALE_TICKS.map((tick) => (
          <span
            key={tick}
            className="tabular absolute -translate-x-1/2 font-mono text-[0.625rem] text-muted-foreground"
            style={{ left: `${((tick - min) / (max - min)) * 100}%` }}
          >
            {tick}°
          </span>
        ))}
      </div>
    </figure>
  );
}
