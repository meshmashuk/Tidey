import { formatTime } from "../format";
import type { TidalEvent } from "../types";
import { EventIcon } from "./TideEventsList";

export function TodaySummary({ events }: { events: TidalEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="w-full shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:w-64 dark:border-slate-800 dark:bg-slate-800/40">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Today's highs &amp; lows
      </h3>
      <ul className="space-y-1.5">
        {events.map((event, i) => {
          const isHigh = event.EventType === "HighWater";
          return (
            <li key={`${event.DateTime}-${i}`} className="flex items-center gap-2 text-sm">
              <span className={isHigh ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"}>
                <EventIcon type={event.EventType} />
              </span>
              <span className="text-slate-500 dark:text-slate-400">{isHigh ? "High" : "Low"}</span>
              <span className="ml-auto font-medium text-slate-900 dark:text-slate-100">{formatTime(event.DateTime)}</span>
              <span className="w-14 text-right text-slate-500 dark:text-slate-400">{event.Height.toFixed(2)} m</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
