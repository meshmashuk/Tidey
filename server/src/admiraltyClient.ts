import { TtlCache } from "./cache.js";

const BASE_URL = "https://admiraltyapi.azure-api.net/uktidalapi/api/V1";

export interface StationProperties {
  Id: string;
  Name: string;
  Country: string;
  ContinuousHeightsAvailable: boolean;
  Footnote: string;
}

export interface StationFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: StationProperties;
}

export interface StationFeatureCollection {
  type: "FeatureCollection";
  features: StationFeature[];
}

export type TidalEventType = "HighWater" | "LowWater";

export interface TidalEvent {
  EventType: TidalEventType;
  DateTime: string;
  Height: number;
  IsApproximateTime: boolean;
  IsApproximateHeight: boolean;
  Filtered: boolean;
}

class AdmiraltyApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AdmiraltyApiError";
  }
}

// Station lists change essentially never; tidal events are predictions that
// don't change within a day. Caching keeps us well inside the Discovery
// tier's free-quota limits under normal browsing.
const stationsCache = new TtlCache<StationFeatureCollection>(24 * 60 * 60 * 1000);
const eventsCache = new TtlCache<TidalEvent[]>(30 * 60 * 1000);

function getApiKey(): string {
  const key = process.env.ADMIRALTY_API_KEY;
  if (!key) {
    throw new Error(
      "ADMIRALTY_API_KEY is not set. Copy server/.env.example to server/.env and add your key.",
    );
  }
  return key;
}

async function callAdmiralty<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Ocp-Apim-Subscription-Key": getApiKey() },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AdmiraltyApiError(
      `Admiralty API request failed (${res.status}): ${body || res.statusText}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

export async function fetchStations(name?: string): Promise<StationFeatureCollection> {
  const cacheKey = name?.trim().toLowerCase() ?? "";
  const cached = stationsCache.get(cacheKey);
  if (cached) return cached;

  const query = name ? `?name=${encodeURIComponent(name)}` : "";
  const data = await callAdmiralty<StationFeatureCollection>(`/Stations${query}`);
  stationsCache.set(cacheKey, data);
  return data;
}

export async function fetchTidalEvents(stationId: string, duration: number): Promise<TidalEvent[]> {
  const cacheKey = `${stationId}:${duration}`;
  const cached = eventsCache.get(cacheKey);
  if (cached) return cached;

  const data = await callAdmiralty<TidalEvent[]>(
    `/Stations/${encodeURIComponent(stationId)}/TidalEvents?duration=${duration}`,
  );
  eventsCache.set(cacheKey, data);
  return data;
}

export { AdmiraltyApiError };
