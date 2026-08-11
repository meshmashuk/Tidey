import { formatTime } from "../format";
import type { Conditions } from "../types";
import { WeatherIcon } from "./WeatherIcon";

const BLOCK_CLASS =
  "flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40 sm:p-4";

/** A small "sea temperature" ripple glyph, matching the hand-rolled SVG style. */
function WaveIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8c2 0 2.5 2 4.5 2S9 8 11 8s2.5 2 4.5 2S18 8 20 8" />
      <path d="M2 13c2 0 2.5 2 4.5 2S9 13 11 13s2.5 2 4.5 2S18 13 20 13" />
      <path d="M2 18c2 0 2.5 2 4.5 2S9 18 11 18s2.5 2 4.5 2S18 18 20 18" />
    </svg>
  );
}

/** A single swell/wave glyph for the wave-height block. */
function SwellIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16c3.5 0 4-9 8-9s3 6 6 6 2.5-3 6-3" />
      <path d="M2 20c3.5 0 4-6 8-6s3 4 6 4 2.5-2 6-2" />
    </svg>
  );
}

export function CurrentConditions({
  conditions,
  loading,
  error,
}: {
  conditions: Conditions | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:mb-3">
        Current conditions
      </h2>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading conditions…</p>}
      {!loading && error && <p className="text-sm text-slate-500 dark:text-slate-400">Conditions unavailable.</p>}

      {!loading && !error && conditions && (
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {/* Weather */}
          <div className={BLOCK_CLASS}>
            {conditions.weather ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-amber-500 dark:text-amber-300">
                  <WeatherIcon coded={conditions.weather.weatherCoded} isDay={conditions.weather.isDay} className="h-8 w-8 sm:h-10 sm:w-10" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
                      {Math.round(conditions.weather.tempC)}°C
                    </span>
                    <span className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {conditions.weather.weather}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Wind {conditions.weather.windDir} {Math.round(conditions.weather.windSpeedMPH)} mph · Humidity{" "}
                    {conditions.weather.humidity}%
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Weather unavailable.</p>
            )}
          </div>

          {/* Sea temperature */}
          <div className={BLOCK_CLASS}>
            {conditions.sea && conditions.sea.seaSurfaceTemperatureC != null ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-sky-600 dark:text-sky-400">
                  <WaveIcon className="h-8 w-8 sm:h-10 sm:w-10" />
                </span>
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {conditions.sea.seaSurfaceTemperatureC.toFixed(1)}°C
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Sea temperature · as of {formatTime(conditions.sea.observedISO)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Sea temperature unavailable.</p>
            )}
          </div>

          {/* Wave height */}
          <div className={BLOCK_CLASS}>
            {conditions.sea && conditions.sea.significantWaveHeightM != null ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-teal-600 dark:text-teal-400">
                  <SwellIcon className="h-8 w-8 sm:h-10 sm:w-10" />
                </span>
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {conditions.sea.significantWaveHeightM.toFixed(1)} m
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Wave height <span title="Significant wave height — the mean height of the highest third of waves">(sig.)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Wave height unavailable.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
