export type WeatherIconName =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export interface WeatherDescription {
  label: string;
  icon: WeatherIconName;
}

const WEATHER_CODES: Record<number, WeatherDescription> = {
  0: { label: "Ciel dégagé", icon: "clear" },
  1: { label: "Plutôt dégagé", icon: "partly-cloudy" },
  2: { label: "Partiellement nuageux", icon: "partly-cloudy" },
  3: { label: "Couvert", icon: "cloudy" },
  45: { label: "Brouillard", icon: "fog" },
  48: { label: "Brouillard givrant", icon: "fog" },
  51: { label: "Bruine légère", icon: "drizzle" },
  53: { label: "Bruine modérée", icon: "drizzle" },
  55: { label: "Bruine dense", icon: "drizzle" },
  56: { label: "Bruine verglaçante légère", icon: "drizzle" },
  57: { label: "Bruine verglaçante dense", icon: "drizzle" },
  61: { label: "Pluie faible", icon: "rain" },
  63: { label: "Pluie modérée", icon: "rain" },
  65: { label: "Pluie forte", icon: "rain" },
  66: { label: "Pluie verglaçante faible", icon: "rain" },
  67: { label: "Pluie verglaçante forte", icon: "rain" },
  71: { label: "Neige faible", icon: "snow" },
  73: { label: "Neige modérée", icon: "snow" },
  75: { label: "Neige forte", icon: "snow" },
  77: { label: "Grains de neige", icon: "snow" },
  80: { label: "Averses faibles", icon: "rain" },
  81: { label: "Averses modérées", icon: "rain" },
  82: { label: "Averses violentes", icon: "rain" },
  85: { label: "Averses de neige faibles", icon: "snow" },
  86: { label: "Averses de neige fortes", icon: "snow" },
  95: { label: "Orage", icon: "thunderstorm" },
  96: { label: "Orage et grêle faible", icon: "thunderstorm" },
  99: { label: "Orage et grêle forte", icon: "thunderstorm" },
};

const UNKNOWN: WeatherDescription = { label: "Conditions inconnues", icon: "cloudy" };

export function describeWeather(code: number): WeatherDescription {
  return WEATHER_CODES[code] ?? UNKNOWN;
}

export function computeComfortScore(params: {
  weatherCode: number;
  temperature: number;
  windSpeed: number;
  precipitationProbability: number;
}): number {
  const { weatherCode, temperature, windSpeed, precipitationProbability } = params;

  const icon = describeWeather(weatherCode).icon;
  const skyPenalty: Record<WeatherIconName, number> = {
    clear: 0,
    "partly-cloudy": 4,
    cloudy: 12,
    fog: 20,
    drizzle: 22,
    rain: 34,
    snow: 34,
    thunderstorm: 48,
  };

  const deltaTemp = Math.max(0, Math.abs(temperature - 22) - 4);
  const tempPenalty = Math.min(40, deltaTemp * 2.6);

  const windPenalty = Math.min(15, Math.max(0, windSpeed - 15) * 0.4);

  const rainPenalty = (precipitationProbability / 100) * 18;

  const score = 100 - skyPenalty[icon] - tempPenalty - windPenalty - rainPenalty;
  return Math.round(Math.max(0, Math.min(100, score)));
}
