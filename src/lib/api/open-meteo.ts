/**
 * Client unique des APIs Open-Meteo (géocodage, prévisions, qualité de l'air).
 *
 * Toute la couche réseau est centralisée ici. Deux conséquences importantes :
 *
 *  1. **Pas de duplication d'appels.** Chaque `fetch` passe par le cache de données
 *     de Next.js (`next.revalidate`). Deux composants serveur qui demandent la météo
 *     de la même ville pendant la fenêtre de revalidation partagent une seule requête
 *     réseau — la déduplication est faite sur l'URL, donc les paramètres sont toujours
 *     construits dans le même ordre via `buildUrl()`.
 *  2. **Erreurs typées.** Les échecs remontent sous forme d'`OpenMeteoError`, ce qui
 *     permet aux `error.tsx` d'afficher un message utile plutôt qu'une trace brute.
 */

import type {
  AirQuality,
  City,
  DailyForecast,
  HourlyForecast,
  RawAirQualityResponse,
  RawForecastResponse,
  RawGeocodingResponse,
  RawGeocodingResult,
  WeatherBundle,
} from "@/lib/types";

const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";

/**
 * Durées de cache, en secondes.
 *
 * Le géocodage est quasi immuable (une ville ne se déplace pas) : 24 h.
 * La météo est rafraîchie toutes les 15 min, ce qui correspond à la cadence
 * de mise à jour réelle des modèles côté Open-Meteo — interroger plus souvent
 * ne renverrait que des données identiques.
 */
const REVALIDATE = {
  geocoding: 60 * 60 * 24,
  weather: 60 * 15,
  airQuality: 60 * 30,
} as const;

/** Erreur applicative levée quand une API externe est indisponible ou répond mal. */
export class OpenMeteoError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenMeteoError";
  }
}

/**
 * Construit une URL avec des paramètres triés par clé.
 *
 * Le tri est ce qui garantit qu'une même requête logique produit toujours la même
 * chaîne, et donc la même entrée de cache Next.js.
 */
function buildUrl(base: string, params: Record<string, string | number | string[]>): string {
  const url = new URL(base);
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return url.toString();
}

/** Effectue un `fetch` JSON typé, mis en cache, et convertit les échecs en `OpenMeteoError`. */
async function fetchJson<T>(url: string, revalidate: number, label: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate } });
  } catch {
    throw new OpenMeteoError(`Impossible de joindre le service ${label}.`);
  }

  if (!response.ok) {
    throw new OpenMeteoError(
      `Le service ${label} a répondu avec le statut ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/* -------------------------------------------------------------------------- */
/*                                  Géocodage                                 */
/* -------------------------------------------------------------------------- */

/** Normalise un résultat brut de géocodage en `City` applicative. */
function toCity(raw: RawGeocodingResult): City {
  return {
    id: raw.id,
    name: raw.name,
    country: raw.country ?? "—",
    countryCode: raw.country_code ?? "",
    admin1: raw.admin1,
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation,
    timezone: raw.timezone,
    population: raw.population,
  };
}

/**
 * Recherche des villes par nom (auto-complétion).
 *
 * Renvoie un tableau vide pour une requête trop courte : cela évite d'inonder l'API
 * de requêtes à un ou deux caractères, qui ne retournent de toute façon rien d'utile.
 */
export async function searchCities(query: string, limit = 8): Promise<City[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = buildUrl(GEOCODING_BASE, {
    name: trimmed,
    count: limit,
    language: "fr",
    format: "json",
  });

  const data = await fetchJson<RawGeocodingResponse>(url, REVALIDATE.geocoding, "de géocodage");
  return (data.results ?? []).map(toCity);
}

/**
 * Meilleur candidat pour un nom donné.
 *
 * En cas d'homonymes, on retient la ville la plus peuplée : c'est presque toujours
 * celle que l'utilisateur avait en tête (« Paris » → France, pas Texas).
 */
async function findBestMatch(name: string): Promise<City | null> {
  const candidates = await searchCities(name, 10);
  if (candidates.length === 0) return null;

  const exactMatches = candidates.filter(
    (city) => city.name.toLowerCase() === name.trim().toLowerCase(),
  );
  const pool = exactMatches.length > 0 ? exactMatches : candidates;

  return pool.reduce((best, city) =>
    (city.population ?? 0) > (best.population ?? 0) ? city : best,
  );
}

/**
 * Résout un nom de ville en une `City` unique — utilisé par la route dynamique
 * `/ville/[nom]` quand l'URL est partagée sans coordonnées.
 *
 * Une seconde tentative remplace les tirets par des espaces : elle rattrape les
 * liens écrits à la main sous la forme `/ville/New-York`, sans pénaliser les
 * communes dont le nom comporte de vrais tirets, essayées en premier.
 */
export async function resolveCity(name: string): Promise<City | null> {
  const direct = await findBestMatch(name);
  if (direct) return direct;

  return name.includes("-") ? findBestMatch(name.replace(/-/g, " ")) : null;
}

/* -------------------------------------------------------------------------- */
/*                                   Météo                                    */
/* -------------------------------------------------------------------------- */

const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "precipitation",
  "cloud_cover",
  "weather_code",
  "is_day",
];

const HOURLY_FIELDS = [
  "temperature_2m",
  "weather_code",
  "precipitation_probability",
  "uv_index",
  "is_day",
];

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "sunrise",
  "sunset",
  "uv_index_max",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
];

/**
 * Récupère conditions actuelles, prévisions horaires et prévisions à 7 jours
 * en **un seul appel réseau** — Open-Meteo accepte les trois blocs simultanément.
 */
export async function getWeather(
  latitude: number,
  longitude: number,
  timezone = "auto",
): Promise<WeatherBundle> {
  const url = buildUrl(FORECAST_BASE, {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: CURRENT_FIELDS,
    hourly: HOURLY_FIELDS,
    daily: DAILY_FIELDS,
    timezone,
    forecast_days: 7,
  });

  const data = await fetchJson<RawForecastResponse>(url, REVALIDATE.weather, "météo");

  const daily: DailyForecast[] = data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    temperatureMax: data.daily.temperature_2m_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    apparentTemperatureMax: data.daily.apparent_temperature_max[i],
    apparentTemperatureMin: data.daily.apparent_temperature_min[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
    uvIndexMax: data.daily.uv_index_max[i],
    precipitationSum: data.daily.precipitation_sum[i],
    precipitationProbabilityMax: data.daily.precipitation_probability_max[i] ?? 0,
    windSpeedMax: data.daily.wind_speed_10m_max[i],
  }));

  // L'API renvoie 7 jours × 24 h. On ne garde que la fenêtre utile à l'affichage :
  // les 24 prochaines heures à partir de l'heure courante.
  const nowIndex = Math.max(
    0,
    data.hourly.time.findIndex((t) => t >= data.current.time),
  );
  const hourly: HourlyForecast[] = data.hourly.time
    .slice(nowIndex, nowIndex + 24)
    .map((time, offset) => {
      const i = nowIndex + offset;
      return {
        time,
        temperature: data.hourly.temperature_2m[i],
        weatherCode: data.hourly.weather_code[i],
        precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
        isDay: data.hourly.is_day[i] === 1,
      };
    });

  return {
    timezone: data.timezone,
    currentUvIndex: data.hourly.uv_index[nowIndex] ?? 0,
    hourly,
    daily,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      pressure: data.current.pressure_msl,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      precipitation: data.current.precipitation,
      cloudCover: data.current.cloud_cover,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                              Qualité de l'air                              */
/* -------------------------------------------------------------------------- */

/**
 * Récupère la qualité de l'air courante.
 *
 * Renvoie `null` plutôt que de propager l'erreur : c'est une donnée d'agrément,
 * indisponible dans certaines régions, et son absence ne doit jamais faire échouer
 * l'affichage de la météo.
 */
export async function getAirQuality(
  latitude: number,
  longitude: number,
): Promise<AirQuality | null> {
  const url = buildUrl(AIR_QUALITY_BASE, {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: [
      "european_aqi",
      "pm2_5",
      "pm10",
      "nitrogen_dioxide",
      "ozone",
      "alder_pollen",
      "birch_pollen",
      "grass_pollen",
      "ragweed_pollen",
    ],
    timezone: "auto",
  });

  try {
    const data = await fetchJson<RawAirQualityResponse>(
      url,
      REVALIDATE.airQuality,
      "de qualité de l'air",
    );
    const c = data.current;

    const pollenValues = [
      c.alder_pollen,
      c.birch_pollen,
      c.grass_pollen,
      c.ragweed_pollen,
    ].filter((value): value is number => typeof value === "number");

    return {
      europeanAqi: c.european_aqi,
      pm2_5: c.pm2_5,
      pm10: c.pm10,
      nitrogenDioxide: c.nitrogen_dioxide,
      ozone: c.ozone,
      pollen: pollenValues.length > 0 ? Math.max(...pollenValues) : undefined,
    };
  } catch {
    return null;
  }
}
