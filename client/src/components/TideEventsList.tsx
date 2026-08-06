import type { TidalEvent } from "../types";
import { formatTime } from "../format";
import { TideIcon } from "./TideIcon";

export function TideEventsList({ events }: { events: TidalEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No tidal events for this day.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((event, i) => {
        const isHigh = event.EventType === "HighWater";
        return (
          <li
            key={`${event.DateTime}-${i}`}
            className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm ${
              isHigh
                ? "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40"
                : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isHigh
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              }`}
            >
              <TideIcon high={isHigh} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {isHigh ? "High water" : "Low water"}
                {event.IsApproximateTime && " (approx.)"}
              </p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{formatTime(event.DateTime)}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {event.Height.toFixed(2)} m{event.IsApproximateHeight && " (approx.)"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
