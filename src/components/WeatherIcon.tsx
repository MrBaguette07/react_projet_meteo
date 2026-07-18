/**
 * Icônes météo en SVG inline.
 *
 * Server Component : aucune interactivité, donc rien à envoyer au client. Le SVG
 * inline évite une requête réseau par icône et laisse les dégradés suivre la
 * palette de l'application.
 *
 * Les dégradés sont déclarés **une seule fois** par `<WeatherIconDefs />`, monté
 * dans le layout racine. Les inclure dans chaque icône dupliquerait les mêmes `id`
 * des dizaines de fois dans le document — un HTML invalide, dont le rendu casserait
 * dès que la première occurrence serait démontée.
 */

import type { WeatherIconName } from "@/lib/weather-codes";

/** Identifiants des dégradés partagés, préfixés pour éviter toute collision. */
const SUN_GRADIENT = "wi-sun";
const MOON_GRADIENT = "wi-moon";
const CLOUD_GRADIENT = "wi-cloud";

/**
 * Dégradés partagés par toutes les icônes.
 *
 * À monter une fois près de la racine du document. Le SVG est de taille nulle et
 * masqué aux technologies d'assistance : il ne sert que de bibliothèque de peintures.
 */
export function WeatherIconDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
      <defs>
        <linearGradient id={SUN_GRADIENT} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id={MOON_GRADIENT} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
        <linearGradient id={CLOUD_GRADIENT} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface WeatherIconProps {
  name: WeatherIconName;
  /** Bascule le soleil en lune pour les conditions nocturnes. */
  isDay?: boolean;
  /** Taille en pixels (l'icône est carrée). */
  size?: number;
  className?: string;
}

/**
 * Astre principal : soleil le jour, lune la nuit.
 *
 * Les rayons sont peints en couleur unie et non avec le dégradé du disque : un
 * `linearGradient` en unités `objectBoundingBox` — le défaut SVG — n'a pas de
 * surface de référence sur un segment vertical de largeur nulle, et le trait ne
 * serait tout simplement pas rendu.
 */
function Luminary({ isDay }: { isDay: boolean }) {
  if (!isDay) {
    return (
      <path
        d="M20.5 15.2a7.5 7.5 0 0 1-9.7-9.7 7.5 7.5 0 1 0 9.7 9.7Z"
        fill={`url(#${MOON_GRADIENT})`}
      />
    );
  }
  return (
    <g>
      <circle cx="12" cy="12" r="4.6" fill={`url(#${SUN_GRADIENT})`} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="12"
          y1="4.2"
          x2="12"
          y2="1.6"
          stroke="#fbbf24"
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </g>
  );
}

/** Silhouette de nuage réutilisée par la plupart des conditions. */
function Cloud({ opacity = 1 }: { opacity?: number }) {
  return (
    <path
      d="M7.4 19.5a4.4 4.4 0 0 1-.4-8.78 5.9 5.9 0 0 1 11.3 1.28 3.75 3.75 0 0 1-.6 7.5H7.4Z"
      fill={`url(#${CLOUD_GRADIENT})`}
      opacity={opacity}
    />
  );
}

/** Gouttes ou flocons sous le nuage, positionnés régulièrement. */
function Drops({ variant }: { variant: "rain" | "drizzle" | "snow" }) {
  const offsets = variant === "drizzle" ? [9.5, 14.5] : [8.5, 12, 15.5];

  return (
    <g>
      {offsets.map((x, index) =>
        variant === "snow" ? (
          <g key={x} stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round">
            <line x1={x} y1={20.4 + (index % 2)} x2={x} y2={23 + (index % 2)} />
            <line x1={x - 1.1} y1={21.1 + (index % 2)} x2={x + 1.1} y2={22.3 + (index % 2)} />
            <line x1={x + 1.1} y1={21.1 + (index % 2)} x2={x - 1.1} y2={22.3 + (index % 2)} />
          </g>
        ) : (
          <line
            key={x}
            x1={x}
            y1={20.4 + (index % 2)}
            x2={x - 1}
            y2={23.2 + (index % 2)}
            stroke="#7dd3fc"
            strokeWidth={variant === "drizzle" ? 1.2 : 1.7}
            strokeLinecap="round"
          />
        ),
      )}
    </g>
  );
}

export function WeatherIcon({ name, isDay = true, size = 48, className }: WeatherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 26"
      fill="none"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      {name === "clear" && <Luminary isDay={isDay} />}

      {name === "partly-cloudy" && (
        <g>
          <g transform="translate(3.5 -2.5) scale(0.78)">
            <Luminary isDay={isDay} />
          </g>
          <Cloud />
        </g>
      )}

      {name === "cloudy" && (
        <g>
          <g transform="translate(4 -1.5) scale(0.72)" opacity="0.55">
            <Cloud />
          </g>
          <Cloud />
        </g>
      )}

      {name === "fog" && (
        <g>
          <Cloud opacity={0.8} />
          {[21, 23].map((y, index) => (
            <line
              key={y}
              x1={5 + index}
              y1={y}
              x2={19 - index}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity={0.75}
            />
          ))}
        </g>
      )}

      {(name === "rain" || name === "drizzle" || name === "snow") && (
        <g>
          <Cloud />
          <Drops variant={name} />
        </g>
      )}

      {name === "thunderstorm" && (
        <g>
          <Cloud />
          <path
            d="M13.2 19.6 10 24.4h2.4l-1 3.4 4-5.2h-2.5l1.4-3Z"
            fill={`url(#${SUN_GRADIENT})`}
            transform="translate(0 -1.6)"
          />
        </g>
      )}
    </svg>
  );
}
