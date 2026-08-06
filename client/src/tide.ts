import { toUtcDate } from "./format";
import type { TidalEvent } from "./types";

export interface TidePoint {
  t: number; // epoch ms
  h: number; // metres
}

export function toTidePoints(events: TidalEvent[]): TidePoint[] {
  return events
    .map((e) => ({ t: toUtcDate(e.DateTime).getTime(), h: e.Height }))
    .sort((a, b) => a.t - b.t);
}

/** Height at an arbitrary instant, modelled as a half-cosine ("versine") curve
 * between each pair of consecutive high/low water events — the standard
 * approximation for a semi-diurnal tide, since it's flat at the turn (like the
 * real tide) and smoothly S-shaped in between. Outside the known event range,
 * height is held flat at the nearest known extreme rather than extrapolated. */
export function interpolateHeight(points: TidePoint[], tMs: number): number {
  if (points.length === 0) return NaN;
  if (tMs <= points[0].t) return points[0].h;
  if (tMs >= points[points.length - 1].t) return points[points.length - 1].h;

  let i = 0;
  while (i < points.length - 1 && points[i + 1].t < tMs) i++;
  const a = points[i];
  const b = points[i + 1];
  const progress = (tMs - a.t) / (b.t - a.t);
  return a.h + (b.h - a.h) * (1 - Math.cos(Math.PI * progress)) / 2;
}

export function sampleCurve(points: TidePoint[], startMs: number, endMs: number, steps: number): TidePoint[] {
  const samples: TidePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = startMs + ((endMs - startMs) * i) / steps;
    samples.push({ t, h: interpolateHeight(points, t) });
  }
  return samples;
}
