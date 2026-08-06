import type { Station } from "./types";

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestStation(stations: Station[], lat: number, lon: number): Station | undefined {
  return stations.reduce<{ station: Station; distance: number } | undefined>((closest, station) => {
    const distance = distanceKm(lat, lon, station.latitude, station.longitude);
    if (!closest || distance < closest.distance) return { station, distance };
    return closest;
  }, undefined)?.station;
}
