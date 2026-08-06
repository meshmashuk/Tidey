import { useEffect, useMemo, useState } from "react";
import { fetchTidalEvents } from "./api";
import { DaySelector } from "./components/DaySelector";
import { StationPicker } from "./components/StationPicker";
import { ThemeToggle } from "./components/ThemeToggle";
import { TideChart } from "./components/TideChart";
import { TideEventsList } from "./components/TideEventsList";
import { TodaySummary } from "./components/TodaySummary";
import { londonDateKey } from "./format";
import { useStations } from "./hooks/useStations";
import { useTheme } from "./hooks/useTheme";
import type { Station, TidalEvent } from "./types";

const LAST_STATION_KEY = "tidey:lastStationId";
const DAYS_AHEAD = 7; // today + next 6 days

const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/60 to-blue-100/50 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/50 sm:p-6";

export default function App() {
  const { mode, toggle } = useTheme();
  const { stations, loading: stationsLoading, error: stationsError } = useStations();

  const [selected, setSelected] = useState<Station | null>(null);
  const [events, setEvents] = useState<TidalEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const todayKey = useMemo(() => londonDateKey(new Date().toISOString()), []);
  const [selectedDay, setSelectedDay] = useState(todayKey);

  // Restore the last-viewed station once the full station list has loaded.
  useEffect(() => {
    if (selected || stations.length === 0) return;
    const lastId = localStorage.getItem(LAST_STATION_KEY);
    const restored = lastId ? stations.find((s) => s.id === lastId) : undefined;
    setSelected(restored ?? stations.find((s) => s.name.toUpperCase().includes("BRIGHTON")) ?? stations[0]);
  }, [stations, selected]);

  useEffect(() => {
    if (!selected) return;
    localStorage.setItem(LAST_STATION_KEY, selected.id);
    setSelectedDay(todayKey);
    setEventsLoading(true);
    setEventsError(null);

    fetchTidalEvents(selected.id, DAYS_AHEAD)
      .then(setEvents)
      .catch((err: unknown) => setEventsError(err instanceof Error ? err.message : "Failed to load tide times"))
      .finally(() => setEventsLoading(false));
  }, [selected, todayKey]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, TidalEvent[]>();
    for (const event of events) {
      const key = londonDateKey(event.DateTime);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.DateTime.localeCompare(b.DateTime));
    }
    return map;
  }, [events]);

  const dayKeys = useMemo(() => {
    const [y, m, d] = todayKey.split("-").map(Number);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const date = new Date(Date.UTC(y, m - 1, d + i));
      return date.toISOString().slice(0, 10);
    });
  }, [todayKey]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tidey</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">UK tide times, station by station</p>
          </div>
          <ThemeToggle mode={mode} onToggle={toggle} />
        </header>

        <section className={CARD_CLASS}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <StationPicker
              stations={stations}
              loading={stationsLoading}
              error={stationsError}
              selected={selected}
              onSelect={setSelected}
            />

            {selected && !eventsLoading && !eventsError && (
              <div className="hidden lg:block">
                <TodaySummary events={eventsByDay.get(todayKey) ?? []} />
              </div>
            )}
          </div>
        </section>

        {selected && !eventsLoading && !eventsError && events.length > 0 && (
          <section className={CARD_CLASS}>
            <TideChart events={events} dayKey={selectedDay} todayKey={todayKey} stationName={selected.name} />
          </section>
        )}

        <section className={CARD_CLASS}>
          {selected && (
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{selected.country}</span>
            </div>
          )}

          <DaySelector dayKeys={dayKeys} todayKey={todayKey} selected={selectedDay} onSelect={setSelectedDay} />

          <div className="mt-4">
            {eventsLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading tide times…</p>}
            {eventsError && <p className="text-sm text-red-600 dark:text-red-400">{eventsError}</p>}
            {!eventsLoading && !eventsError && (
              <TideEventsList events={eventsByDay.get(selectedDay) ?? []} />
            )}
          </div>
        </section>

        <footer className="mt-auto pt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Tidal predictions from the ADMIRALTY UK Tidal API, UK Hydrographic Office. For navigational purposes,
          always refer to official Admiralty products.
        </footer>
      </div>
    </div>
  );
}
