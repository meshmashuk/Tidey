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

function cosineInterpolate(a: TidePoint, b: TidePoint, tMs: number): number {
  const progress = (tMs - a.t) / (b.t - a.t);
  return a.h + (b.h - a.h) * (1 - Math.cos(Math.PI * progress)) / 2;
}

/** A tide is roughly self-similar cycle to cycle, so when we're asked for a
 * time before/after the known events (the API only gives today onward — there's
 * no previous-day event to interpolate from) we reflect the nearest known
 * segment to synthesise a plausible neighbour, rather than holding flat. */
function mirrorBefore(points: TidePoint[]): TidePoint {
  const [p0, p1] = points;
  return { t: p0.t - (p1.t - p0.t), h: p1.h };
}

function mirrorAfter(points: TidePoint[]): TidePoint {
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return { t: last.t + (last.t - prev.t), h: prev.h };
}

/** Height at an arbitrary instant, modelled as a half-cosine ("versine") curve
 * between each pair of consecutive high/low water events — the standard
 * approximation for a semi-diurnal tide, since it's flat at the turn (like the
 * real tide) and smoothly S-shaped in between. */
export function interpolateHeight(points: TidePoint[], tMs: number): number {
  if (points.length === 0) return NaN;
  if (points.length === 1) return points[0].h;

  if (tMs <= points[0].t) return cosineInterpolate(mirrorBefore(points), points[0], tMs);
  if (tMs >= points[points.length - 1].t) return cosineInterpolate(points[points.length - 1], mirrorAfter(points), tMs);

  let i = 0;
  while (i < points.length - 1 && points[i + 1].t < tMs) i++;
  return cosineInterpolate(points[i], points[i + 1], tMs);
}

export function sampleCurve(points: TidePoint[], startMs: number, endMs: number, steps: number): TidePoint[] {
  const samples: TidePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = startMs + ((endMs - startMs) * i) / steps;
    samples.push({ t, h: interpolateHeight(points, t) });
  }
  return samples;
}
