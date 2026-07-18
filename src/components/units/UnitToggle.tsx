"use client";

/**
 * Bascule entre le système métrique et le système impérial.
 *
 * Présentée comme un interrupteur segmenté à deux positions plutôt qu'un bouton
 * unique : l'état courant et l'état disponible sont visibles simultanément, sans
 * avoir à déduire ce que produirait un clic.
 *
 * Le groupe porte `role="group"` et chaque bouton `aria-pressed`, ce qui annonce
 * aux lecteurs d'écran laquelle des deux options est active.
 *
 * Avant l'hydratation, la préférence réelle est inconnue : le composant rend alors
 * une zone inerte de mêmes dimensions. Cela évite d'annoncer brièvement « °C »
 * actif à un utilisateur ayant choisi « °F », et empêche tout décalage de mise en
 * page à l'arrivée du JavaScript.
 */

import type { UnitSystem } from "@/lib/units";
import { useUnits } from "@/lib/units";
import { cn } from "@/lib/utils";

const OPTIONS: ReadonlyArray<{ system: UnitSystem; label: string; hint: string }> = [
  { system: "metric", label: "°C", hint: "Système métrique — degrés Celsius, km/h, mm, hPa" },
  { system: "imperial", label: "°F", hint: "Système impérial — degrés Fahrenheit, mph, in, inHg" },
];

export function UnitToggle({ className }: { className?: string }) {
  const { system, isLoaded, setSystem } = useUnits();

  if (!isLoaded) {
    return (
      <div
        className={cn("h-8 w-[4.75rem] rounded-md border bg-card", className)}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      role="group"
      aria-label="Système d'unités"
      className={cn("flex h-8 items-center rounded-md border bg-card p-0.5", className)}
    >
      {OPTIONS.map((option) => {
        const isActive = option.system === system;

        return (
          <button
            key={option.system}
            type="button"
            onClick={() => setSystem(option.system)}
            aria-pressed={isActive}
            title={option.hint}
            className={cn(
              "tabular h-7 rounded-[0.25rem] px-2.5 font-mono text-xs font-medium transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
