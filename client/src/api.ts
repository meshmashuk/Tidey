import { toUtcDate } from "./format";
import type { Conditions, Station, StationFeatureCollection, TidalEvent } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function toStation(feature: StationFeatureCollection["features"][number]): Station {
  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    id: feature.properties.Id,
    name: feature.properties.Name,
    country: feature.properties.Country,
    longitude,
    latitude,
  };
}

export async function fetchAllStations(): Promise<Station[]> {
  const data = await getJson<StationFeatureCollection>("/api/stations");
  return data.features.map(toStation).sort((a, b) => a.name.localeCompare(b.name));
}

/** A handful of stations return events with a null/malformed DateTime or a
 * non-finite Height (seen on some secondary/estuary stations). Drop those
 * rather than let one bad entry take down every date-keyed view downstream. */
function isUsableEvent(e: TidalEvent): boolean {
  return (
    typeof e.DateTime === "string" &&
    !Number.isNaN(toUtcDate(e.DateTime).getTime()) &&
    Number.isFinite(e.Height) &&
    (e.EventType === "HighWater" || e.EventType === "LowWater")
  );
}

export async function fetchTidalEvents(stationId: string, duration = 7): Promise<TidalEvent[]> {
  const events = await getJson<TidalEvent[]>(`/api/stations/${encodeURIComponent(stationId)}/events?duration=${duration}`);
  return events.filter(isUsableEvent);
}

/** Current weather + sea-surface temperature at the station's coordinates. */
export async function fetchConditions(latitude: number, longitude: number): Promise<Conditions> {
  return getJson<Conditions>(`/api/conditions?lat=${latitude}&lng=${longitude}`);
}
