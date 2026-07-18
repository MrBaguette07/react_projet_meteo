import type {
  AirQuality,
  City,
  DailyForecast,
  HourlyForecast,
  RawAirQualityResponse,
  RawForecastResponse,
  RawGeocodingResponse,
  RawGeocodingResult,
  RawReverseGeocodeResponse,
  WeatherBundle,
} from "@/lib/types";

const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";

const REVALIDATE = {
  geocoding: 60 * 60 * 24,
  weather: 60 * 15,
  airQuality: 60 * 30,
} as const;

export class OpenMeteoError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenMeteoError";
  }
}

function buildUrl(base: string, params: Record<string, string | number | string[]>): string {
  const url = new URL(base);
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return url.toString();
}

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

function toCity(raw: RawGeocodingResult): City {
  return {
    id: raw.id,
    name: raw.name,
    country: raw.country ?? "-",
    countryCode: raw.country_code ?? "",
    admin1: raw.admin1,
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation,
    timezone: raw.timezone,
    population: raw.population,
  };
}

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

export async function resolveCity(name: string): Promise<City | null> {
  const direct = await findBestMatch(name);
  if (direct) return direct;

  return name.includes("-") ? findBestMatch(name.replace(/-/g, " ")) : null;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<City | null> {
  const url = buildUrl("https://api.bigdatacloud.net/data/reverse-geocode-client", {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    localityLanguage: "fr",
  });

  const data = await fetchJson<RawReverseGeocodeResponse>(
    url,
    REVALIDATE.geocoding,
    "de géolocalisation",
  );

  const name = data.city?.trim() || data.locality?.trim();
  if (!name) return null;

  const resolved = await resolveCity(name);
  const isNearby =
    resolved !== null &&
    Math.abs(resolved.latitude - latitude) < 0.75 &&
    Math.abs(resolved.longitude - longitude) < 0.75;

  if (isNearby) return resolved;

  return {
    id: Math.round(latitude * 1000) * 100000 + Math.round(longitude * 1000),
    name,
    country: data.countryName ?? "-",
    countryCode: data.countryCode ?? "",
    admin1: data.principalSubdivision || undefined,
    latitude,
    longitude,
    timezone: "auto",
  };
}

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
