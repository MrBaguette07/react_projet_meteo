import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
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
  aside?: ReactNode;
  className?: string;
}

export function SectionHeading({ children, aside, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="field-label">{children}</h2>
      {aside}
    </div>
  );
}
