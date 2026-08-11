import { TtlCache } from "./cache.js";

const BASE_URL = "https://data.api.xweather.com";

/** Shape we return to the client — a small, stable subset of the raw
 * Xweather payloads. Either half can be null if that upstream call fails,
 * so one flaky endpoint never blanks the whole conditions block. */
export interface CurrentWeather {
  tempC: number;
  weather: string;
  /** Xweather cloud/precip category code, e.g. "::FW" — drives our icon. */
  weatherCoded: string;
  windDir: string;
  windSpeedMPH: number;
  humidity: number;
  isDay: boolean;
  place: string | null;
  observedISO: string;
}

export interface SeaConditions {
  seaSurfaceTemperatureC: number | null;
  /** Significant wave height (mean of the highest third of waves), metres. */
  significantWaveHeightM: number | null;
  observedISO: string;
}

export interface Conditions {
  weather: CurrentWeather | null;
  sea: SeaConditions | null;
}

class XweatherApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "XweatherApiError";
  }
}

// Current weather refreshes ~hourly upstream; sea-surface temperature changes
// very slowly. Cache per rounded coordinate to get a hit on the same station.
const conditionsCache = new TtlCache<Conditions>(10 * 60 * 1000);

function getCredentials(): { id: string; secret: string } {
  const id = process.env.XWEATHER_CLIENT_ID;
  const secret = process.env.XWEATHER_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      "XWEATHER_CLIENT_ID / XWEATHER_CLIENT_SECRET are not set. Add them to server/.env (see server/.env.example).",
    );
  }
  return { id, secret };
}

async function callXweather<T>(endpoint: string, place: string, extra = ""): Promise<T> {
  const { id, secret } = getCredentials();
  const url =
    `${BASE_URL}/${endpoint}/${encodeURIComponent(place)}` +
    `?client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}${extra}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new XweatherApiError(
      `Xweather ${endpoint} request failed (${res.status}): ${body || res.statusText}`,
      res.status,
    );
  }

  const json = (await res.json()) as { success: boolean; error: unknown; response: T };
  if (!json.success) {
    throw new XweatherApiError(
      `Xweather ${endpoint} returned an error: ${JSON.stringify(json.error)}`,
      502,
    );
  }
  return json.response;
}

// Raw upstream shapes (only the fields we read).
interface ConditionsPeriod {
  dateTimeISO: string;
  tempC: number;
  humidity: number;
  windDir: string;
  windSpeedMPH: number;
  weather: string;
  weatherPrimaryCoded: string;
  isDay: boolean;
}
interface MaritimePeriod {
  dateTimeISO: string;
  seaSurfaceTemperatureC: number | null;
  significantWaveHeightM: number | null;
}

async function fetchCurrentWeather(coord: string): Promise<CurrentWeather | null> {
  const response = await callXweather<
    Array<{ place?: { name?: string }; periods: ConditionsPeriod[] }>
  >("conditions", coord);
  const entry = response[0];
  const p = entry?.periods?.[0];
  if (!p) return null;
  return {
    tempC: p.tempC,
    weather: p.weather,
    weatherCoded: p.weatherPrimaryCoded,
    windDir: p.windDir,
    windSpeedMPH: p.windSpeedMPH,
    humidity: p.humidity,
    isDay: p.isDay,
    place: entry.place?.name ?? null,
    observedISO: p.dateTimeISO,
  };
}

async function fetchSeaConditions(coord: string): Promise<SeaConditions | null> {
  const response = await callXweather<Array<{ periods: MaritimePeriod[] }>>(
    "maritime",
    coord,
    "&to=now",
  );
  const p = response[0]?.periods?.[0];
  if (!p) return null;
  return {
    seaSurfaceTemperatureC: p.seaSurfaceTemperatureC ?? null,
    significantWaveHeightM: p.significantWaveHeightM ?? null,
    observedISO: p.dateTimeISO,
  };
}

export async function fetchConditions(lat: number, lng: number): Promise<Conditions> {
  // Round to 3 dp (~110 m) so repeated views of the same station share a cache slot.
  const coord = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = conditionsCache.get(coord);
  if (cached) return cached;

  // Fetch both halves independently; a failure in one shouldn't sink the other.
  const [weatherResult, seaResult] = await Promise.allSettled([
    fetchCurrentWeather(coord),
    fetchSeaConditions(coord),
  ]);

  const weather = weatherResult.status === "fulfilled" ? weatherResult.value : null;
  const sea = seaResult.status === "fulfilled" ? seaResult.value : null;

  if (weatherResult.status === "rejected") console.error("Xweather conditions:", weatherResult.reason);
  if (seaResult.status === "rejected") console.error("Xweather maritime:", seaResult.reason);

  // If both failed, surface an error rather than caching an empty shell.
  if (!weather && !sea) {
    const reason =
      weatherResult.status === "rejected" ? weatherResult.reason : seaResult.status === "rejected" ? seaResult.reason : null;
    throw reason instanceof Error
      ? reason
      : new XweatherApiError("Xweather returned no usable conditions data", 502);
  }

  const data: Conditions = { weather, sea };
  conditionsCache.set(coord, data);
  return data;
}

export { XweatherApiError };
