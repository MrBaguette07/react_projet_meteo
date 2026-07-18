/**
 * Helpers de présentation : formatage des nombres, dates et échelles qualitatives.
 *
 * Aucune logique métier ici — uniquement la mise en forme destinée à l'affichage.
 * Regrouper ces fonctions évite que chaque composant réinvente son propre format
 * et garantit une cohérence visuelle sur toutes les pages.
 */

import type { City, FavoriteCity } from "@/lib/types";

const FR = "fr-FR";

/** Arrondit une température et y accole le symbole degré (ex. « 18° »). */
export function formatTemperature(value: number): string {
  return `${Math.round(value)}°`;
}

/** Formate une valeur numérique avec une unité (ex. « 12 km/h »). */
export function formatMeasure(value: number, unit: string, digits = 0): string {
  return `${value.toLocaleString(FR, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${unit}`;
}

/**
 * Formate une heure déjà exprimée dans le fuseau de la ville consultée.
 *
 * Open-Meteo renvoie des horodatages en heure locale mais **sans** suffixe de
 * fuseau (`2026-07-18T14:00`). Les interpréter naïvement les décalerait vers le
 * fuseau du serveur — et le rendu serveur différerait alors du rendu client.
 * On les lit donc comme de l'UTC et on les réaffiche en UTC : l'aller-retour est
 * neutre et restitue exactement l'heure locale fournie par l'API.
 */
export function formatTime(isoString: string): string {
  return new Date(`${isoString}Z`).toLocaleTimeString(FR, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** Nom du jour, ou « Aujourd'hui » / « Demain » pour les deux premières dates. */
export function formatDayLabel(isoDate: string, index: number): string {
  if (index === 0) return "Aujourd'hui";
  if (index === 1) return "Demain";
  const label = new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(FR, {
    weekday: "long",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Date courte pour la ligne secondaire des prévisions (ex. « 24 juil. »). */
export function formatShortDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(FR, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Convertit une direction en degrés en point cardinal français. */
export function formatWindDirection(degrees: number): string {
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  return points[Math.round(degrees / 22.5) % 16];
}

/** Libellé et couleur associés à un indice UV. */
export function describeUvIndex(uv: number): { label: string; tone: Tone } {
  if (uv < 3) return { label: "Faible", tone: "good" };
  if (uv < 6) return { label: "Modéré", tone: "moderate" };
  if (uv < 8) return { label: "Élevé", tone: "high" };
  if (uv < 11) return { label: "Très élevé", tone: "severe" };
  return { label: "Extrême", tone: "severe" };
}

/** Libellé et couleur associés à l'indice européen de qualité de l'air. */
export function describeAqi(aqi: number): { label: string; tone: Tone } {
  if (aqi <= 20) return { label: "Excellente", tone: "good" };
  if (aqi <= 40) return { label: "Bonne", tone: "good" };
  if (aqi <= 60) return { label: "Moyenne", tone: "moderate" };
  if (aqi <= 80) return { label: "Médiocre", tone: "high" };
  if (aqi <= 100) return { label: "Mauvaise", tone: "severe" };
  return { label: "Très mauvaise", tone: "severe" };
}

/** Échelle qualitative partagée par les badges de l'interface. */
export type Tone = "good" | "moderate" | "high" | "severe";

/**
 * Classes de badge associées à chaque niveau de l'échelle `Tone`.
 *
 * Fonds très désaturés et texte foncé : sur fond clair, un aplat saturé
 * attirerait plus l'œil que la donnée elle-même, alors que ces badges ne sont
 * que des qualificatifs.
 */
export const TONE_CLASSES: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  moderate: "bg-amber-50 text-amber-900 ring-amber-600/20",
  high: "bg-orange-50 text-orange-900 ring-orange-600/25",
  severe: "bg-rose-50 text-rose-900 ring-rose-600/25",
};

/** Couleur pleine correspondant à chaque niveau, pour les jauges et les points. */
export const TONE_FILLS: Record<Tone, string> = {
  good: "bg-emerald-600",
  moderate: "bg-amber-500",
  high: "bg-orange-500",
  severe: "bg-rose-600",
};

/**
 * Transforme un code pays ISO alpha-2 en emoji drapeau.
 *
 * Les drapeaux Unicode sont composés de deux « regional indicator symbols »,
 * situés 127 397 points de code au-dessus des lettres majuscules correspondantes.
 */
export function countryFlag(countryCode: string): string {
  if (countryCode.length !== 2) return "";
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((char) => char.charCodeAt(0) + 127397),
  );
}

/** Marqueur d'une donnée absente, à ne pas afficher telle quelle. */
const UNKNOWN_VALUE = "—";

/** Sous-titre d'une ville : région et pays, quand ils sont connus. */
export function formatCitySubtitle(city: Pick<City, "admin1" | "country">): string {
  return [city.admin1, city.country]
    .filter((part): part is string => Boolean(part) && part !== UNKNOWN_VALUE)
    .join(", ");
}

/**
 * Construit le segment d'URL d'une ville pour la route `/ville/[nom]`.
 *
 * Le nom est conservé **tel quel**, seul l'encodage d'URL est appliqué par
 * `cityHref()`. Remplacer les espaces par des tirets rendrait la conversion
 * inverse ambiguë : « Bordeaux-en-Gâtinais » et « Bordeaux en Gâtinais »
 * produiraient le même segment, et le géocodage ne retrouverait plus la bonne
 * commune au retour — c'est exactement ce qui faisait apparaître un pays et un
 * fuseau horaire vides sur les villes à nom composé.
 */
export function citySlug(name: string): string {
  return name.trim();
}

/** Opération inverse de `citySlug()`, appliquée au paramètre de route. */
export function slugToName(slug: string): string {
  return decodeURIComponent(slug).trim();
}

/**
 * Lien vers la page de détail d'une ville.
 *
 * Les coordonnées sont passées en query string : elles évitent un appel de
 * géocodage supplémentaire à l'arrivée et lèvent toute ambiguïté sur les homonymes.
 */
export function cityHref(city: Pick<City | FavoriteCity, "name" | "latitude" | "longitude">): string {
  const params = new URLSearchParams({
    lat: city.latitude.toFixed(4),
    lon: city.longitude.toFixed(4),
  });
  return `/ville/${encodeURIComponent(citySlug(city.name))}?${params}`;
}
