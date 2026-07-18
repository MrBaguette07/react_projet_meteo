/**
 * Cellule de relevé : un intitulé de champ et sa valeur.
 *
 * Reprend la disposition d'une feuille d'observation — étiquette en petites
 * capitales monospacées, valeur en condensé. Les deux ne peuvent pas être
 * confondues, même en balayage rapide.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricProps {
  label: string;
  value: string;
  /** Précision optionnelle affichée sous la valeur. */
  hint?: string;
  /** Pastille ou icône affichée à droite de l'intitulé. */
  badge?: ReactNode;
  className?: string;
}

export function Metric({ label, value, hint, badge, className }: MetricProps) {
  return (
    <div className={cn("border-t pt-2.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="field-label">{label}</span>
        {badge}
      </div>
      <p className="tabular mt-1 font-heading text-2xl font-semibold leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SectionHeadingProps {
  children: ReactNode;
  /** Contenu aligné à droite du titre (légende, badge…). */
  aside?: ReactNode;
  className?: string;
}

/** Titre de bloc, homogène sur toutes les fiches. */
export function SectionHeading({ children, aside, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="field-label">{children}</h2>
      {aside}
    </div>
  );
}
