import { tool } from "ai";
import { z } from "zod";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type GeocodingResult = {
  results?: Array<{
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
};

type ForecastResult = {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  current_units?: Record<string, string>;
};

const WEATHER_CODE_MAP: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export const getWeather = tool({
  description:
    "Get current weather for a city or place. Use this whenever the user asks about weather, temperature, rain, snow, or conditions for a named location. Accepts city names in any language (e.g. '北京', 'Tokyo', 'San Francisco').",
  inputSchema: z.object({
    location: z
      .string()
      .min(1)
      .describe(
        "City or place name in any language. Examples: '北京', '上海', 'Tokyo', 'San Francisco'."
      ),
  }),
  execute: async ({ location }) => {
    const signal = AbortSignal.timeout(6000);

    const geoUrl = new URL(GEOCODING_URL);
    geoUrl.searchParams.set("name", location);
    geoUrl.searchParams.set("count", "1");
    geoUrl.searchParams.set("language", "en");
    geoUrl.searchParams.set("format", "json");

    const geoRes = await fetch(geoUrl, { signal });
    if (!geoRes.ok) {
      throw new Error(`Geocoding failed: ${geoRes.status}`);
    }
    const geo = (await geoRes.json()) as GeocodingResult;
    const place = geo.results?.[0];
    if (!place) {
      return {
        ok: false as const,
        error: `No location found for "${location}".`,
      };
    }

    const fcUrl = new URL(FORECAST_URL);
    fcUrl.searchParams.set("latitude", String(place.latitude));
    fcUrl.searchParams.set("longitude", String(place.longitude));
    fcUrl.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day"
    );
    fcUrl.searchParams.set("timezone", place.timezone ?? "auto");

    const fcRes = await fetch(fcUrl, { signal });
    if (!fcRes.ok) {
      throw new Error(`Forecast failed: ${fcRes.status}`);
    }
    const fc = (await fcRes.json()) as ForecastResult;
    const current = fc.current;
    if (!current) {
      return {
        ok: false as const,
        error: "Forecast response missing 'current' block.",
      };
    }

    return {
      ok: true as const,
      location: {
        name: place.name,
        admin1: place.admin1,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone,
      },
      current: {
        time: current.time,
        temperature_c: current.temperature_2m,
        apparent_temperature_c: current.apparent_temperature,
        humidity_pct: current.relative_humidity_2m,
        wind_speed_kmh: current.wind_speed_10m,
        is_day: current.is_day === 1,
        condition:
          WEATHER_CODE_MAP[current.weather_code] ??
          `Unknown (code ${current.weather_code})`,
      },
    };
  },
});
