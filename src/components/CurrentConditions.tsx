import { WeatherIcon } from "@/components/WeatherIcon";
import { Metric } from "@/components/Metric";
import { Card, CardContent } from "@/components/ui/card";
import { describeWeather } from "@/lib/weather-codes";
import { temperatureColor } from "@/lib/temperature-scale";
import {
  describeUvIndex,
  formatMeasure,
  formatTime,
  formatWindDirection,
  TONE_FILLS,
} from "@/lib/format";
import {
  Precipitation,
  Pressure,
  Temperature,
  TemperatureUnit,
  WindSpeed,
} from "@/components/units/Measurement";
import { ConvertedTemperature } from "@/components/units/ConvertedTemperature";
import type { CurrentWeather } from "@/lib/types";

interface CurrentConditionsProps {
  current: CurrentWeather;
  uvIndex: number;
  temperatureMin: number;
  temperatureMax: number;
}

export function CurrentConditions({
  current,
  uvIndex,
  temperatureMin,
  temperatureMax,
}: CurrentConditionsProps) {
  const description = describeWeather(current.weatherCode);
  const uv = describeUvIndex(uvIndex);
  const accent = temperatureColor(current.temperature);

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(160deg, ${temperatureColor(current.temperature, 0.06)}, transparent 62%)`,
      }}
    >
      {/* Filet supérieur à la couleur de la température : repère visuel constant. */}
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} aria-hidden="true" />

      <CardContent className="pt-2">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="field-label">Relevé de {formatTime(current.time)}</p>

            <div className="mt-3 flex items-start">
              <ConvertedTemperature
                celsius={current.temperature}
                className="tabular font-heading text-[5.5rem] font-semibold leading-[0.85] tracking-tight sm:text-[7rem]"
              />
              <span className="mt-2 font-heading text-3xl font-medium text-muted-foreground">
                <TemperatureUnit />
              </span>
            </div>

            <p className="mt-4 font-heading text-xl font-medium">{description.label}</p>
            <p className="tabular mt-1 text-sm text-muted-foreground">
              Ressenti <Temperature celsius={current.apparentTemperature} /> · Min{" "}
              <Temperature celsius={temperatureMin} /> · Max{" "}
              <Temperature celsius={temperatureMax} />
            </p>
          </div>

          <WeatherIcon
            name={description.icon}
            isDay={current.isDay}
            size={132}
            className="ml-auto shrink-0"
          />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Humidité" value={formatMeasure(current.humidity, "%")} />
          <Metric label="Pression" value={<Pressure hectopascals={current.pressure} />} />
          <Metric
            label="Vent"
            value={<WindSpeed kilometersPerHour={current.windSpeed} />}
            hint={
              <>
                {formatWindDirection(current.windDirection)} · rafales{" "}
                <WindSpeed kilometersPerHour={current.windGusts} />
              </>
            }
          />
          <Metric label="Nébulosité" value={formatMeasure(current.cloudCover, "%")} />
          <Metric
            label="Précipitations"
            value={<Precipitation millimeters={current.precipitation} />}
          />
          <Metric
            label="Indice UV"
            value={uvIndex.toFixed(1)}
            hint={uv.label}
            badge={
              <span
                className={`size-2 rounded-full ${TONE_FILLS[uv.tone]}`}
                aria-hidden="true"
              />
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
