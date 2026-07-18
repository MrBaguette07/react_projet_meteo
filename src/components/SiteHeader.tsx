import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UnitToggle } from "@/components/units/UnitToggle";

const NAV_LINKS = [
  { href: "/", label: "Relevés" },
  { href: "/comparer", label: "Comparateur" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-8 items-center justify-center rounded-md bg-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="9.5" cy="8.5" r="3.2" fill="oklch(0.78 0.14 75)" />
              <path
                d="M8.6 19.2a4 4 0 0 1-.4-7.98 5.5 5.5 0 0 1 10.5 1.18 3.4 3.4 0 0 1-.5 6.8H8.6Z"
                fill="oklch(0.98 0 0)"
              />
            </svg>
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">
            Météo
            <span className="ml-1 font-mono text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Station
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label="Navigation principale">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Seul îlot client de l'en-tête : la préférence vit dans le navigateur. */}
          <UnitToggle />
        </div>
      </div>
    </header>
  );
}
