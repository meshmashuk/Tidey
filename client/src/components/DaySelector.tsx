import { dayLabel, formatDayHeading } from "../format";

interface Props {
  dayKeys: string[];
  todayKey: string;
  selected: string;
  onSelect: (dayKey: string) => void;
}

export function DaySelector({ dayKeys, todayKey, selected, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Select day"
      className="day-scroll flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
    >
      {dayKeys.map((key) => {
        const isSelected = key === selected;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(key)}
            title={formatDayHeading(key)}
            className={`relative isolate shrink-0 overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition ${
              isSelected
                ? "border-sky-700/40 bg-gradient-to-b from-sky-500 to-sky-700 text-white shadow-md shadow-sky-900/30"
                : "border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 text-slate-700 shadow-sm hover:border-slate-400 hover:to-slate-300 dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:from-slate-700"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 40 8"
              preserveAspectRatio="none"
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-2.5 w-full ${isSelected ? "opacity-40" : "opacity-25"}`}
            >
              <path
                d="M0,4 C5,0.5 10,7.5 15,4 C20,0.5 25,7.5 30,4 C35,0.5 40,7.5 40,4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="relative">{dayLabel(key, todayKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
