import { useMemo, useRef, useState } from "react";
import type { Station } from "../types";
import { nearestStation } from "../geo";

interface Props {
  stations: Station[];
  loading: boolean;
  error: string | null;
  selected: Station | null;
  onSelect: (station: Station) => void;
}

export function StationPicker({ stations, loading, error, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter((s) => s.name.toLowerCase().includes(q));
  }, [stations, query]);

  function choose(station: Station) {
    onSelect(station);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocateError("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const nearest = nearestStation(stations, pos.coords.latitude, pos.coords.longitude);
        if (nearest) choose(nearest);
        else setLocateError("No stations loaded yet — try again in a moment.");
      },
      (err) => {
        setLocating(false);
        setLocateError(err.message || "Couldn't get your location.");
      },
      { timeout: 10_000 },
    );
  }

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="station-search" className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
        Tidal station
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="station-search"
            ref={inputRef}
            type="text"
            value={query}
            placeholder={selected ? selected.name : "Search by station name…"}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          {open && results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(s)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <span>{s.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-slate-400 dark:text-slate-500">{s.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={loading || locating}
          title="Use my location"
          className="flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {locateError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{locateError}</p>}
      {loading && <p className="mt-1 text-xs text-slate-400">Loading stations…</p>}
    </div>
  );
}
