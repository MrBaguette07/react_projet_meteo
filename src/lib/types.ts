/**
 * Types du domaine métier de l'application.
 *
 * Deux familles de types cohabitent volontairement :
 *  - les types `Raw*` qui décrivent, au plus près, les réponses brutes d'Open-Meteo ;
 *  - les types applicatifs (City, CurrentWeather, DailyForecast…) manipulés par les
 *    composants, une fois les données normalisées.
 *
 * Cette séparation isole l'UI des changements de l'API externe : seul le mapping
 * dans `src/lib/api/open-meteo.ts` a besoin d'être adapté si le fournisseur évolue.
 */

/* -------------------------------------------------------------------------- */
/*                                    Ville                                   */
/* -------------------------------------------------------------------------- */

/** Une ville normalisée, telle qu'utilisée partout dans l'application. */
export interface City {
  /** Identifiant Open-Meteo, stable et utilisé comme clé de favori. */
  id: number;
  name: string;
  /** Nom du pays (ex. « France »). */
  country: string;
  /** Code ISO-3166 alpha-2, utilisé pour afficher le drapeau (ex. « FR »). */
  countryCode: string;
  /** Région/département quand l'API le fournit (ex. « Île-de-France »). */
  admin1?: string;
  latitude: number;
  longitude: number;
  /** Altitude en mètres. */
  elevation?: number;
  /** Fuseau horaire IANA (ex. « Europe/Paris »). */
  timezone: string;
  /** Population, utilisée pour départager les résultats homonymes. */
  population?: number;
}

/* -------------------------------------------------------------------------- */
/*                                    Météo                                   */
/* -------------------------------------------------------------------------- */

/** Conditions météo instantanées. */
export interface CurrentWeather {
  /** Horodatage ISO de la mesure, exprimé dans le fuseau de la ville. */
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  /** Pression réduite au niveau de la mer, en hPa. */
  pressure: number;
  windSpeed: number;
  /** Direction du vent en degrés (0 = nord). */
  windDirection: number;
  windGusts: number;
  precipitation: number;
  cloudCover: number;
  /** Code météo WMO (voir `src/lib/weather-codes.ts`). */
  weatherCode: number;
  isDay: boolean;
}

/** Prévision agrégée pour une journée. */
export interface DailyForecast {
  /** Date au format `YYYY-MM-DD`. */
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  /** Horodatage ISO du lever du soleil. */
  sunrise: string;
  /** Horodatage ISO du coucher du soleil. */
  sunset: string;
  /** Indice UV maximal de la journée. */
  uvIndexMax: number;
  precipitationSum: number;
  /** Probabilité maximale de précipitation, en pourcentage. */
  precipitationProbabilityMax: number;
  windSpeedMax: number;
}

/** Prévision horaire, utilisée pour la courbe des prochaines heures. */
export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  isDay: boolean;
}

/** Agrégat renvoyé par `getWeather()` : tout ce dont la page détail a besoin. */
export interface WeatherBundle {
  current: CurrentWeather;
  /** Indice UV courant, extrait des données horaires (absent du bloc `current`). */
  currentUvIndex: number;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  timezone: string;
}

/* -------------------------------------------------------------------------- */
/*                              Qualité de l'air                              */
/* -------------------------------------------------------------------------- */

/** Mesures de qualité de l'air (API Air Quality d'Open-Meteo). */
export interface AirQuality {
  /** Indice européen de qualité de l'air (0 = excellent, 100+ = très mauvais). */
  europeanAqi: number;
  pm2_5: number;
  pm10: number;
  /** Dioxyde d'azote, en µg/m³. */
  nitrogenDioxide: number;
  ozone: number;
  /** Indice de risque pollinique agrégé, absent hors Europe. */
  pollen?: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Favoris                                   */
/* -------------------------------------------------------------------------- */

/**
 * Un favori stocké dans le `localStorage`.
 *
 * On ne persiste qu'un sous-ensemble de `City` : les données météo sont toujours
 * re-téléchargées, et on évite ainsi de servir un cache périmé depuis le navigateur.
 */
export interface FavoriteCity {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  /** Horodatage epoch de l'ajout, utilisé pour trier du plus récent au plus ancien. */
  addedAt: number;
}

/* -------------------------------------------------------------------------- */
/*                                 Historique                                 */
/* -------------------------------------------------------------------------- */

/**
 * Une ville consultée, conservée dans l'historique.
 *
 * Structurellement proche de `FavoriteCity`, mais sémantiquement distincte : un
 * favori est choisi et permanent, une visite est enregistrée automatiquement et
 * finit par sortir de la liste. Les garder séparés évite qu'une évolution de l'un
 * n'impose une migration du stockage de l'autre.
 */
export interface VisitedCity {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  /** Horodatage epoch de la dernière consultation. */
  visitedAt: number;
}

/* -------------------------------------------------------------------------- */
/*                          Réponses brutes Open-Meteo                         */
/* -------------------------------------------------------------------------- */

export interface RawGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  population?: number;
}

export interface RawGeocodingResponse {
  results?: RawGeocodingResult[];
}

export interface RawForecastResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    precipitation: number;
    cloud_cover: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    uv_index: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

/**
 * Réponse de géocodage inverse (BigDataCloud).
 *
 * Tous les champs sont optionnels : l'API renvoie des chaînes vides plutôt que
 * des absences en pleine mer ou en zone non cartographiée.
 */
export interface RawReverseGeocodeResponse {
  /** Commune principale ; vide en zone rurale, `locality` prend alors le relais. */
  city?: string;
  locality?: string;
  countryName?: string;
  countryCode?: string;
  /** Région administrative de premier niveau (ex. « Île-de-France »). */
  principalSubdivision?: string;
}

export interface RawAirQualityResponse {
  current: {
    european_aqi: number;
    pm2_5: number;
    pm10: number;
    nitrogen_dioxide: number;
    ozone: number;
    alder_pollen?: number | null;
    birch_pollen?: number | null;
    grass_pollen?: number | null;
    ragweed_pollen?: number | null;
  };
}
