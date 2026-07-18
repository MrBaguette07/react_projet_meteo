interface ColorStop {
  temperature: number;
  lightness: number;
  chroma: number;
  hue: number;
}

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

export function temperatureColor(temperature: number, alpha = 1): string {
  const first = STOPS[0];
  const last = STOPS[STOPS.length - 1];

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

export function temperatureTextColor(temperature: number): string {
  const match = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/.exec(temperatureColor(temperature));
  if (!match) return "currentColor";

  const lightness = Math.min(Number(match[1]), 0.48);
  const chroma = Math.min(Number(match[2]) * 1.35, 0.2);
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${match[3]})`;
}

export const SCALE_TICKS = [-10, 0, 10, 20, 30, 40] as const;

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
