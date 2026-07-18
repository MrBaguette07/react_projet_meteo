/**
 * Échelle chromatique de température — l'élément signature de l'interface.
 *
 * Dans cette application, la couleur n'est pas décorative : elle **encode la
 * donnée**. Chaque température affichée porte la teinte correspondant à sa valeur,
 * si bien qu'une ville chaude et une ville fraîche se distinguent avant même
 * d'avoir lu le moindre chiffre.
 *
 * L'échelle suit la convention des cartes météorologiques — bleu pour le froid,
 * rouge pour le chaud — avec un point important : autour de 17 °C, la chroma
 * s'effondre presque à zéro. Le passage du bleu au chaud traverse donc une zone
 * quasi neutre au lieu de virer au vert, ce qui éviterait un dégradé « arc-en-ciel »
 * illisible et sans rapport avec l'usage.
 *
 * Les couleurs sont produites en OKLCH : contrairement au RVB, l'interpolation y
 * conserve une clarté perçue constante, sans les zones ternes qu'un dégradé RVB
 * fait apparaître entre deux teintes éloignées.
 */

interface ColorStop {
  /** Température en °C à laquelle ce point de l'échelle s'applique. */
  temperature: number;
  /** Clarté OKLCH (0–1). */
  lightness: number;
  /** Chroma OKLCH. */
  chroma: number;
  /** Teinte OKLCH en degrés. */
  hue: number;
}

/** Points d'ancrage de l'échelle, du grand froid à la canicule. */
const STOPS: ColorStop[] = [
  { temperature: -15, lightness: 0.52, chroma: 0.14, hue: 264 },
  { temperature: 0, lightness: 0.62, chroma: 0.12, hue: 248 },
  { temperature: 10, lightness: 0.7, chroma: 0.075, hue: 230 },
  { temperature: 17, lightness: 0.74, chroma: 0.03, hue: 150 },
  { temperature: 24, lightness: 0.72, chroma: 0.1, hue: 70 },
  { temperature: 32, lightness: 0.64, chroma: 0.16, hue: 45 },
  { temperature: 42, lightness: 0.55, chroma: 0.2, hue: 27 },
];

function interpolate(from: number, to: number, ratio: number): number {
  return from + (to - from) * ratio;
}

/**
 * Couleur CSS associée à une température, en OKLCH.
 *
 * @param temperature Température en degrés Celsius.
 * @param alpha Opacité, utile pour les fonds de surface (0–1).
 */
export function temperatureColor(temperature: number, alpha = 1): string {
  const first = STOPS[0];
  const last = STOPS[STOPS.length - 1];

  // Hors bornes : on plafonne plutôt que d'extrapoler, sans quoi une valeur
  // aberrante produirait une couleur hors gamut.
  if (temperature <= first.temperature) return format(first, alpha);
  if (temperature >= last.temperature) return format(last, alpha);

  const upperIndex = STOPS.findIndex((stop) => stop.temperature > temperature);
  const lower = STOPS[upperIndex - 1];
  const upper = STOPS[upperIndex];
  const ratio = (temperature - lower.temperature) / (upper.temperature - lower.temperature);

  return format(
    {
      temperature,
      lightness: interpolate(lower.lightness, upper.lightness, ratio),
      chroma: interpolate(lower.chroma, upper.chroma, ratio),
      hue: interpolate(lower.hue, upper.hue, ratio),
    },
    alpha,
  );
}

function format(stop: ColorStop, alpha: number): string {
  const { lightness, chroma, hue } = stop;
  const base = `${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)}`;
  return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${alpha})`;
}

/**
 * Variante assombrie, destinée au **texte** posé sur fond clair.
 *
 * Les teintes de l'échelle sont calibrées pour des aplats et des traits ; telles
 * quelles, les plus claires (autour de 17 °C) n'atteindraient pas le contraste
 * AA sur du blanc. On abaisse donc la clarté et on relève la chroma pour le texte.
 */
export function temperatureTextColor(temperature: number): string {
  const match = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/.exec(temperatureColor(temperature));
  if (!match) return "currentColor";

  const lightness = Math.min(Number(match[1]), 0.48);
  const chroma = Math.min(Number(match[2]) * 1.35, 0.2);
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${match[3]})`;
}

/** Graduations affichées par la légende de l'échelle, en °C. */
export const SCALE_TICKS = [-10, 0, 10, 20, 30, 40] as const;

/**
 * Dégradé CSS couvrant toute l'échelle.
 *
 * Échantillonné tous les 2 °C : suffisamment fin pour être perçu continu, et
 * fidèle à la courbe réelle — un dégradé à deux arrêts la court-circuiterait.
 */
export function temperatureGradient(direction = "to right"): string {
  const min = SCALE_TICKS[0];
  const max = SCALE_TICKS[SCALE_TICKS.length - 1];
  const steps: string[] = [];

  for (let temperature = min; temperature <= max; temperature += 2) {
    const position = ((temperature - min) / (max - min)) * 100;
    steps.push(`${temperatureColor(temperature)} ${position.toFixed(1)}%`);
  }

  return `linear-gradient(${direction}, ${steps.join(", ")})`;
}
