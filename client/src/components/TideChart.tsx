import { useEffect, useMemo, useRef, useState } from "react";
import { dayLabel, formatTimeMs, londonMidnightMs } from "../format";
import { interpolateHeight, sampleCurve, toTidePoints, type TidePoint } from "../tide";
import type { TidalEvent } from "../types";

const HEIGHT = 240;
const DEFAULT_WIDTH = 720;
const PAD = { top: 34, right: 16, bottom: 28, left: 34 };
const SAMPLE_STEPS = 144; // every 10 minutes

const NICE_STEPS = [0.5, 1, 2, 2.5, 5, 10];
const TARGET_TICKS = 5;

function niceYDomain(values: number[]): { min: number; max: number; ticks: number[] } {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max((rawMax - rawMin) * 0.2, 0.3);
  const roughRange = rawMax - rawMin + pad * 2;
  const step = NICE_STEPS.find((s) => roughRange / s <= TARGET_TICKS) ?? NICE_STEPS[NICE_STEPS.length - 1];
  const min = Math.floor((rawMin - pad) / step) * step;
  const max = Math.ceil((rawMax + pad) / step) * step;

  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);
  return { min, max, ticks };
}

/** Tracks the container's real pixel width so the SVG's viewBox can match it
 * 1:1. Without this, viewBox scaling shrinks text on narrow screens along
 * with everything else — fine for shapes, illegible for labels. */
function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

interface TideChartProps {
  events: TidalEvent[];
  dayKey: string;
  todayKey: string;
  stationName: string;
}

export function TideChart({ events, dayKey, todayKey, stationName }: TideChartProps) {
  const [containerRef, width] = useContainerWidth<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const isToday = dayKey === todayKey;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const points = useMemo(() => toTidePoints(events), [events]);
  const dayStartMs = useMemo(() => londonMidnightMs(dayKey), [dayKey]);
  const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

  const dayEvents = useMemo(
    () => points.filter((p) => p.t >= dayStartMs && p.t <= dayEndMs),
    [points, dayStartMs, dayEndMs],
  );

  const samples = useMemo(
    () => sampleCurve(points, dayStartMs, dayEndMs, SAMPLE_STEPS),
    [points, dayStartMs, dayEndMs],
  );

  if (points.length === 0 || samples.length === 0) return <div ref={containerRef} className="tide-chart w-full" />;

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const yDomain = niceYDomain([...samples.map((s) => s.h), ...dayEvents.map((e) => e.h)]);
  const scaleX = (t: number) => PAD.left + ((t - dayStartMs) / (dayEndMs - dayStartMs)) * plotW;
  const scaleY = (h: number) => PAD.top + (1 - (h - yDomain.min) / (yDomain.max - yDomain.min)) * plotH;
  const baselineY = PAD.top + plotH;

  const linePath = samples.map((s, i) => `${i === 0 ? "M" : "L"}${scaleX(s.t).toFixed(1)},${scaleY(s.h).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${scaleX(samples[samples.length - 1].t).toFixed(1)},${baselineY} L${scaleX(samples[0].t).toFixed(1)},${baselineY} Z`;

  const nowInRange = isToday && now >= dayStartMs && now <= dayEndMs;
  const nowHeight = nowInRange ? interpolateHeight(points, now) : null;

  // Skip midnight ticks below ~420px — they crowd against the edge labels.
  const hourMarks = width < 420 ? [6, 12, 18] : [0, 6, 12, 18, 24];
  const hourTicks = hourMarks.map((h) => dayStartMs + h * 60 * 60 * 1000);

  function handlePointer(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const fracX = (clientX - rect.left) / rect.width;
    const svgX = fracX * width;
    const t = dayStartMs + ((svgX - PAD.left) / plotW) * (dayEndMs - dayStartMs);
    setHoverT(Math.min(Math.max(t, dayStartMs), dayEndMs));
  }

  const hoverHeight = hoverT !== null ? interpolateHeight(points, hoverT) : null;
  const hoverX = hoverT !== null ? scaleX(hoverT) : null;
  const hoverY = hoverHeight !== null ? scaleY(hoverHeight) : null;
  const tooltipW = 100;
  const tooltipLeft = hoverX !== null && hoverX > width - tooltipW - 16;
  const label = dayLabel(dayKey, todayKey);
  const heading = label === "Today" || label === "Tomorrow" ? `${label}'s tide` : `Tide for ${label}`;

  return (
    <div ref={containerRef} className="tide-chart w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{heading}: {stationName}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">Estimated curve, UK local time</p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        width={width}
        height={HEIGHT}
        className="touch-none select-none"
        style={{ width: "100%", height: `${HEIGHT}px` }}
        role="img"
        aria-label={`Estimated tide height for ${label}${isToday ? ", with current position marked" : ""}`}
        onPointerMove={(e) => handlePointer(e.clientX)}
        onPointerLeave={() => setHoverT(null)}
      >
        {yDomain.ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={scaleY(tick)}
              y2={scaleY(tick)}
              stroke="var(--tide-grid)"
              strokeWidth={1}
            />
            <text x={PAD.left - 6} y={scaleY(tick)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--tide-muted)">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        {hourTicks.map((t) => (
          <text key={t} x={scaleX(t)} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--tide-muted)">
            {formatTimeMs(t)}
          </text>
        ))}

        <path d={areaPath} fill="var(--tide-series-wash)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--tide-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {dayEvents.map((e) => {
          const isHigh = samplesRise(points, e.t);
          return (
            <g key={e.t}>
              <circle cx={scaleX(e.t)} cy={scaleY(e.h)} r={4} fill="var(--tide-series)" stroke="var(--tide-surface)" strokeWidth={2} />
              <text
                x={scaleX(e.t)}
                y={scaleY(e.h) + (isHigh ? -10 : 18)}
                textAnchor="middle"
                fontSize={10}
                fill="var(--tide-secondary)"
              >
                {formatTimeMs(e.t)}
              </text>
            </g>
          );
        })}

        {nowInRange && nowHeight !== null && (
          <g>
            <line x1={scaleX(now)} x2={scaleX(now)} y1={PAD.top} y2={baselineY} stroke="var(--tide-baseline)" strokeWidth={1} />
            <circle cx={scaleX(now)} cy={scaleY(nowHeight)} r={6} fill="var(--tide-series)" stroke="var(--tide-surface)" strokeWidth={2} />
            <text x={scaleX(now)} y={PAD.top - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--tide-primary)">
              Now · {nowHeight.toFixed(2)} m
            </text>
          </g>
        )}

        {hoverT !== null && hoverHeight !== null && hoverX !== null && hoverY !== null && (
          <g>
            <line x1={hoverX} x2={hoverX} y1={PAD.top} y2={baselineY} stroke="var(--tide-baseline)" strokeWidth={1} />
            <circle cx={hoverX} cy={hoverY} r={4} fill="var(--tide-surface)" stroke="var(--tide-series)" strokeWidth={2} />
            <g transform={`translate(${tooltipLeft ? hoverX - tooltipW - 8 : hoverX + 8}, ${Math.max(PAD.top, hoverY - 36)})`}>
              <rect width={tooltipW} height={34} rx={6} fill="var(--tide-surface)" stroke="var(--tide-border)" strokeWidth={1} />
              <text x={8} y={14} fontSize={11} fontWeight={600} fill="var(--tide-primary)">
                {hoverHeight.toFixed(2)} m
              </text>
              <text x={8} y={27} fontSize={10} fill="var(--tide-secondary)">
                {formatTimeMs(hoverT)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

/** Whether the tide is rising into this event (i.e. it's a high water) — used
 * only to decide which side of the point to place its time label. */
function samplesRise(points: TidePoint[], t: number): boolean {
  const before = interpolateHeight(points, t - 5 * 60 * 1000);
  const at = interpolateHeight(points, t);
  return at >= before;
}
